
from flask import Blueprint
from flask import current_app
import re



from . import db
from . import pushNotifications



bp = Blueprint("reminders", "reminders", url_prefix="/reminders")




def scheduleNextReminder():
    from .scheduler import scheduler
    with scheduler.app.app_context(): 
        scheduler.remove_all_jobs()
        print(scheduler.get_jobs())
        conn = db.get_db()  
        cursor = conn.cursor()
        cursor.execute("select t.task_due from tasks t where t.task_status='incomplete' order by t.task_due limit 1")
        earliestOverdue = cursor.fetchone()
        cursor.execute("select r.remind_time from reminders r order by r.remind_time limit 1")
        earliestReminder = cursor.fetchone()
        overdueTasks = []
        reminders = []
        if earliestReminder == None and not earliestOverdue == None:
            cursor.execute("select t.id, t.task_due from tasks t where t.task_status='incomplete' and t.task_due = %s limit 50",(earliestOverdue,))
            overdueTasks = cursor.fetchall()
        elif not earliestReminder == None and earliestOverdue == None:
            cursor.execute("select t.id, t.task_due from tasks t where t.task_status='incomplete' and t.task_due = %s limit 50",(earliestOverdue,))
            overdueTasks = cursor.fetchall()
        elif not earliestReminder == None and not earliestOverdue == None:
            if earliestOverdue[0]>earliestReminder[0]:
                cursor.execute("select r.id, r.remind_time from reminders r where r.remind_time=%s limit 30",(earliestReminder,))
                reminders = cursor.fetchall()
            elif earliestReminder[0]>earliestOverdue[0]:
                cursor.execute("select t.id, t.task_due from tasks t where t.task_status='incomplete' and t.task_due = %s limit 50",(earliestOverdue,))
                overdueTasks = cursor.fetchall()
            else:
                cursor.execute("select t.id, t.task_due from tasks t where t.task_status='incomplete' and t.task_due = %s limit 50",(earliestOverdue,))
                overdueTasks = cursor.fetchall()
                query = "select r.id, r.remind_time from reminders r where r.remind_time=%s limit "+str(50-len(overdueTasks))+';'
                cursor.execute(query,(earliestReminder,))
                reminders = cursor.fetchall()
        for task in overdueTasks:
            taskID = task[0]
            time = task[1]
            print(time)
            scheduler.add_job(func=pushNotifications.pushReminder,args=(taskID,'overdue'), next_run_time=time,id='overdue'+str(taskID))
            print("Overdue Scheduled")
        for reminder in reminders:
            reminderID = reminder[0]
            time = reminder[1]
            print(time)
            scheduler.add_job(func=pushNotifications.pushReminder,args=(reminderID,'reminder'), next_run_time=time,id='reminder'+str(reminderID))
            print("Reminder Scheduled")
        current_app.config['SCHEDULED_JOBS']=len(reminders) +len(overdueTasks)

def handleMissedReminders(event):
    from .scheduler import scheduler
    with scheduler.app.app_context(): 
        conn = db.get_db()  
        cursor = conn.cursor()
        reResult = re.search(r"^([a-z]+)(\d+)$",event.job_id).groups()
        category = reResult[0]
        id = reResult[1]
        if category == 'reminder':
            cursor.execute("delete from reminders where id = %s",(id,))
        
        elif category == 'overdue':
            cursor.execute("update tasks set task_status = 'overdue' where id = %s",(id,))
        
        conn.commit()
        current_app.config['SCHEDULED_JOBS'] -= 1 
        if current_app.config['SCHEDULED_JOBS'] == 0:
                scheduleNextReminder()
