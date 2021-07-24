import re
import datetime
from flask import Blueprint
from flask import render_template, request, redirect, url_for, jsonify

from flask import g


from . import reminders as Reminders
from . import db


bp = Blueprint("tasks", "tasks", url_prefix="/tasks")


def markOverDueTasks():
    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute("select t.id, t.task_due, t.task_status from tasks t")
    tasks = cursor.fetchall()
    now = datetime.datetime.utcnow()
    for task in tasks:
        if task[2] != "done" or task[2] != "overdue":
            if(task[1]<now):
                cursor.execute("update tasks set task_status = 'overdue' where id = %s",(task[0],))

    conn.commit()    


def queries(status, orderBy, order='asc'):
    if status not in ["incomplete","done","overdue"]:
        if orderBy == 'id':
            if order == 'asc':
                return "select * from tasks order by id;"
            else:
                return "select * from tasks order by id desc;"

        elif orderBy == 'name':
            if order == 'asc':
                return "select * from tasks order by task_name;"
            else:
                return "select * from tasks order by task_name desc;"
        elif orderBy == 'due':
            if order == 'asc':
                return "select * from tasks order by due;"
            else:
                return "select * from tasks order by due desc;"
    else:
        if orderBy == 'id':
            if order == 'asc':
                return "select * from tasks where task_status = %s order by id;"
            else:
                return "select * from tasks where task_status = %s order by id desc;"

        elif orderBy == 'name':
            if order == 'asc':
                return "select * from tasks where task_status = %s order by task_name;"
            else:
                return "select * from tasks where task_status = %s order by task_name desc;"
        elif orderBy == 'due':
            if order == 'asc':
                return "select * from tasks where task_status = %s order by due;"
            else:
                return "select * from tasks where task_status = %s order by due desc;"





@bp.route("/getAllTasks/<status>/<orderBy>/<order>")
def getallTasks(status,orderBy,order):
    if (request.accept_mimetypes.best == "application/json"): 
        if('First-Call' in request.headers.keys() and  request.headers['First-Call']=='true'):
            markOverDueTasks()
            Reminders.markBehindScheduleReminders()
        conn = db.get_db()                 
        cursor = conn.cursor()
        query = queries(status,orderBy,order)         
        if status=="incomplete":
            status='' 
        cursor.execute(query,(status,))  
        tasks = cursor.fetchall()
        tasksWithTags = []
        for task in tasks:
            id = task[0]
            cursor.execute("select tags.name from tags, tasks_tags tt where tt.task_id = %s and tags.id = tt.tag_id",(id,));
            tags = [tag[0] for tag in cursor.fetchall()]
            taskWithTags = task + (tags,)
            tasksWithTags.append(taskWithTags)
        tasksWithTagsAndReminders = []
        for task in tasksWithTags:
            id = task[0]
            cursor.execute("select r.id,r.reminder,r.remind_time from reminders r, tasks_reminders tr where tr.task_id = %s and r.id = tr.reminder_id and r.on_schedule = true",(id,));     
            reminders = [dict(id=id,reminder=reminder,remindTime=remindTime) for id,reminder,remindTime in cursor.fetchall()]
            taskWithTagsAndReminders = task + (reminders,)
            tasksWithTagsAndReminders.append(taskWithTagsAndReminders)
    
        return jsonify(dict(tasks = [dict(id = id, taskName=taskName, taskDue= taskDue, taskDesc = taskDesc, taskStatus=taskStatus, tags=tags, reminders = reminders) for id, taskName, taskDue, taskDesc, taskStatus, tags, reminders in tasksWithTagsAndReminders]))
    else:
        return "invalid request", 404



@bp.route("/addTasks", methods=["POST"])
def addTasks():
    if request.method == "POST":
        formData = request.json["formData"]
        taskName = formData["taskName"]
        taskDue = formData["taskDue"]
        tags = formData["tags"]
        reminders = formData["reminders"]
        taskDesc = formData["taskDesc"]
        taskStart = datetime.datetime.strptime(taskDue[0:-5], "%Y-%m-%dT%H:%M:%S")
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute("insert into tasks (task_name, task_due, task_desc, task_status) values (%s,%s,%s,'')",(taskName,taskDue,taskDesc))
        cursor.execute("select id from tasks order by id desc limit 1")
        taskID = cursor.fetchone()[0]
        for tag in tags:
            cursor.execute("select count(*) from tags where name = %s",(tag,))
            if(cursor.fetchone()[0]==0):
                cursor.execute("insert into tags (name) values (%s)",(tag,))
                
            cursor.execute("select id from tags where name=%s",(tag,))
            tagID = cursor.fetchone()[0]
            cursor.execute("insert into tasks_tags values (%s,%s)",(taskID,tagID))
        
        for reminder in reminders:
            val = int(re.search(r"\b\d+\b",reminder).group())
            unit = re.search(r"\b[a-z/]+\b",reminder).group()
            if (unit == "min/s"):
                delta = datetime.timedelta(minutes=val)
            elif(unit == "hr/s"):
                delta = datetime.timedelta(hours=val)
            else:
                delta = datetime.timedelta(days=val)
            remind_time = taskStart-delta
            cursor.execute("insert into reminders (reminder, remind_time, on_schedule) values (%s,%s,true)",(reminder,remind_time))
            cursor.execute("select id from reminders order by id desc limit 1")
            reminderID = cursor.fetchone()
            cursor.execute("insert into tasks_reminders values (%s,%s)",(taskID,reminderID))
        conn.commit()
        return "done", 200
    else:
        return "invalid request",404

@bp.route("/markOverdue", methods=["POST"])
def markOverdue():
    if request.method == "POST":
        tasks = request.json["overdueTasks"]
        conn = db.get_db()
        cursor = conn.cursor()
        for task in tasks:
            taskID = task["id"]
            cursor.execute("update tasks set task_status = 'overdue' where id=%s",(taskID,))
        conn.commit()
        return "done", 200
    else:
        return "invalid request",404
