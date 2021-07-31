import re
import datetime
from flask import Blueprint
from flask import request, jsonify
from flask_jwt_extended.view_decorators import jwt_required
from flask_jwt_extended import current_user

from . import reminders as Reminders
from . import db



bp = Blueprint("tasks", "tasks", url_prefix="/tasks")


def markOverDueTasks(userID):
    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute("select t.id, t.task_due, t.task_status from tasks t, users_tasks ut where ut.user_id = %s and t.id = ut.task_id",(userID,))
    tasks = cursor.fetchall()
    now = datetime.datetime.utcnow()
    for task in tasks:
        if task[2] != "done" and task[2] != "overdue":
            if(task[1]<now):
                cursor.execute("update tasks set task_status = 'overdue' where id = %s",(task[0],))

    conn.commit()    


def queries(status, orderBy, order='asc'):
    if status not in ["incomplete","done","overdue"]:
        if orderBy == 'id':
            if order == 'asc':
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and u.id = ut.user_id and ut.task_id = t.id order by t.id;"
            else:
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and u.id = ut.user_id and ut.task_id = t.id order by t.id desc;"

        elif orderBy == 'name':
            if order == 'asc':
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and u.id = ut.user_id and ut.task_id = t.id order by t.task_name;"
            else:
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and u.id = ut.user_id and ut.task_id = t.id order by t.task_name desc;"
        elif orderBy == 'due':
            if order == 'asc':
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and u.id = ut.user_id and ut.task_id = t.id order by t.due;"
            else:
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and u.id = ut.user_id and ut.task_id = t.id order by t.due desc;"
    else:
        if orderBy == 'id':
            if order == 'asc':
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and t.task_status = %s and u.id = ut.user_id and ut.task_id = t.id order by t.id;"
            else:
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and t.task_status = %s and u.id = ut.user_id and ut.task_id = t.id order by t.id desc;"

        elif orderBy == 'name':
            if order == 'asc':
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and t.task_status = %s and u.id = ut.user_id and ut.task_id = t.id order by t.task_name;"
            else:
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and t.task_status = %s and u.id = ut.user_id and ut.task_id = t.id order by t.task_name desc;"
        elif orderBy == 'due':
            if order == 'asc':
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and t.task_status = %s and u.id = ut.user_id and ut.task_id = t.id order by t.task_due;"
            else:
                return "select t.* from tasks t, users u, users_tasks ut where u.id = %s and t.task_status = %s and u.id = ut.user_id and ut.task_id = t.id order by t.task_due desc;"





@bp.route("/getAllTasks/<status>/<orderBy>/<order>")
@jwt_required()
def getallTasks(status,orderBy,order):
    if (request.accept_mimetypes.best == "application/json"):
        userID = current_user[0]
        if 'Mark-Overdue-Tasks' in request.headers.keys() and request.headers['Mark-Overdue-Tasks']=="true":
            markOverDueTasks(userID)     
        conn = db.get_db()                 
        cursor = conn.cursor()
        query = queries(status,orderBy,order)         
        if status not in ["incomplete","done","overdue"]:
            cursor.execute(query,(userID,)) 
        else:
            cursor.execute(query,(userID,status)) 
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
            cursor.execute("select r.id,r.reminder,r.remind_time from reminders r, tasks_reminders tr where tr.task_id = %s and r.id = tr.reminder_id",(id,));     
            reminders = [dict(id=id,reminder=reminder,remindTime=remindTime) for id,reminder,remindTime in cursor.fetchall()]
            taskWithTagsAndReminders = task + (reminders,)
            tasksWithTagsAndReminders.append(taskWithTagsAndReminders)
    
        return jsonify(dict(tasks = [dict(id = id, taskName=taskName, taskDue= taskDue, taskDesc = taskDesc, taskStatus=taskStatus, tags=tags, reminders = reminders) for id, taskName, taskDue, taskDesc, taskStatus, tags, reminders in tasksWithTagsAndReminders]))
    else:
        return "invalid request", 404



@bp.route("/addTasks", methods=["POST"])
@jwt_required()
def addTasks():
    if request.method == "POST":
        userID = current_user[0]
        formData = request.json["formData"]
        taskName = formData["taskName"]
        taskDue = formData["taskDue"]
        tags = formData["tags"]
        reminders = formData["reminders"]
        taskDesc = formData["taskDesc"]
        taskStart = datetime.datetime.strptime(taskDue[0:-5], "%Y-%m-%dT%H:%M:%S")
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute("insert into tasks (task_name, task_due, task_desc, task_status) values (%s,%s,%s,'incomplete')",(taskName,taskDue,taskDesc))
        cursor.execute("select id from tasks order by id desc limit 1")
        taskID = cursor.fetchone()[0]
        cursor.execute("insert into users_tasks values (%s,%s)",(userID,taskID))

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
            cursor.execute("insert into reminders (reminder, remind_time) values (%s,%s)",(reminder,remind_time))
            cursor.execute("select id from reminders order by id desc limit 1")
            reminderID = cursor.fetchone()
            cursor.execute("insert into tasks_reminders values (%s,%s)",(taskID,reminderID))
        conn.commit()
        Reminders.scheduleNextReminder()
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


@bp.route("/deleteTasks", methods=["POST"])
@jwt_required()
def deleteTasks():
    if request.method == "POST":
        userID = current_user[0]
        taskIDs = request.json["taskIDs"]
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute("select t.id from tasks t, users_tasks ut where ut.task_id = t.id and ut.user_id = %s and t.id in %s",(userID,tuple(taskIDs)))
        taskIDs = cursor.fetchall()
        for taskID in taskIDs:
            cursor.execute("select tr.reminder_id from tasks_reminders tr where tr.task_id =%s",(taskID,))
            for reminderID in cursor.fetchall():
                cursor.execute("delete from reminders where id=%s",(reminderID[0],))
            cursor.execute("delete from tasks where id = %s",(taskID,))
        conn.commit()
        return "done", 200
    else:
        return "invalid request",404


@bp.route("/markDone", methods=["POST"])
@jwt_required()
def markDone():
    if request.method == "POST":
        taskIDs = request.json["taskIDs"]
        userID = current_user[0]
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute("select t.id from tasks t, users_tasks ut where ut.task_id = t.id and ut.user_id = %s and t.id in %s",(userID,tuple(taskIDs)))
        taskIDs = cursor.fetchall()
        for taskID in taskIDs:
            cursor.execute("select reminder_id from tasks_reminders where task_id =%s",(taskID,))
            for reminderID in cursor.fetchall():
                cursor.execute("delete from reminders where id=%s",(reminderID[0],))
            cursor.execute("update tasks set task_status = 'done' where id=%s",(taskID,))
        conn.commit()
        return "done", 200
    else:
        return "invalid request",404

@bp.route("/markIncomplete", methods=["POST"])
@jwt_required()
def markIncomplete():
    if request.method == "POST":
        taskIDs = request.json["taskIDs"]
        conn = db.get_db()
        cursor = conn.cursor()
        userID = current_user[0]
        cursor.execute("select t.id from tasks t, users_tasks ut where ut.task_id = t.id and ut.user_id = %s and t.id in %s",(userID,tuple(taskIDs)))
        taskIDs = cursor.fetchall()
        for taskID in taskIDs:
            cursor.execute("update tasks set task_status = 'incomplete' where id=%s",(taskID,))
        conn.commit()
       
        return "done", 200
    else:
        return "invalid request",404