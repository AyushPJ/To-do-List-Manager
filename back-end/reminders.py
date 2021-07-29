
import datetime
from flask import Blueprint
from flask import request, jsonify



from . import db
from . import pushNotifications



bp = Blueprint("reminders", "reminders", url_prefix="/reminders")


def getRemindersBehindSchedule():
    if (request.accept_mimetypes.best == "application/json"):
        conn = db.get_db()                 
        cursor = conn.cursor()
        
        cursor.execute("select id, reminder, remind_time from reminders where on_schedule = false")
            
        reminders = cursor.fetchall()
        remindersWithTasks = []
        for reminder in reminders:
            cursor.execute("select t.id, t.task_name, t.task_due, t.task_desc, t.task_status from tasks t, tasks_reminders tr where t.id=tr.task_id and tr.reminder_id=%s",(reminder[0],))
            resp = cursor.fetchone()
            task = dict(id = resp[0], taskName=resp[1], taskDue= resp[2],  taskDesc = resp[3], taskStatus=resp[4])
            reminderWithTask = reminder + (task,)
            remindersWithTasks.append(reminderWithTask)
        
        return jsonify(dict(reminders = [dict(id = id, reminder=reminder, remindTime=remindTime, task=task) for id, reminder, remindTime, task in remindersWithTasks]))
    else:
        return "invalid request", 404



def deleteReminders():
    if request.method == "POST":
        conn = db.get_db()
        cursor = conn.cursor()
        tasksReminders = request.json["tasksReminders"]
        for taskReminder in tasksReminders:
            reminder = taskReminder["reminder"]
            reminderID = reminder["id"]
            cursor.execute("delete from reminders r where id=%s",(reminderID,))
        conn.commit()
        return "done", 200
    else:
        return "invalid request",404

def markBehindScheduleReminders():
    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute("select r.id, r.remind_time from reminders r")
    reminders = cursor.fetchall()
    now = datetime.datetime.utcnow()
    for reminder in reminders:
        if reminder[1] < now:
            cursor.execute("update reminders set on_schedule = false where id = %s",(reminder[0],))
    conn.commit()


def scheduleNextReminder():
    from .scheduler import scheduler
    with scheduler.app.app_context(): 
        scheduler.remove_all_jobs()
        conn = db.get_db()  
        cursor = conn.cursor()
        cursor.execute("select r.id, r.remind_time from reminders r order by remind_time limit 10")
        reminders = cursor.fetchall()
        i=0
        for reminder in reminders:
            print(reminder)
            reminderID = reminder[0]
            time = reminder[1]
            print(time)
            scheduler.add_job(func=pushNotifications.pushReminder,args=(reminderID,), next_run_time=time,id='scheduled-reminder'+str(i))
            print('scheduled')
            i=i+1