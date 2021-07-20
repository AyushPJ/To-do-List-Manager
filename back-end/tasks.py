import re
import datetime
from typing import Tuple
from flask import Blueprint
from flask import render_template, request, redirect, url_for, jsonify

from flask import g


from . import db


bp = Blueprint("tasks", "tasks", url_prefix="/tasks")


@bp.route("/getAllTasks")
def allTasks():
    conn = db.get_db() 
                     
    cursor = conn.cursor()
    cursor.execute("select t.id, t.task_name, t.task_due, t.task_desc from tasks t") # Query
    tasks = cursor.fetchall()
    tasksWithTags = []
    for task in tasks:
        id = task[0]
        cursor.execute("select tags.name from tags, tasks_tags tt where tt.task_id = %s and tags.id = tt.tag_id",(id,));
        tags = [tag[0] for tag in cursor.fetchall()]
        taskWithTags = task + (tags,)
        tasksWithTags.append(taskWithTags)

    if (request.accept_mimetypes.best == "application/json"):
        return jsonify(dict(tasks = [dict(id = id, taskName=taskName, taskDue= taskDue, taskDesc = taskDesc, tags=tags) for id, taskName, taskDue, taskDesc, tags in tasksWithTags]))
    else:
        return "invalid request", 404

@bp.route("/addTasks", methods=["POST"])
def addTask():
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
        cursor.execute("insert into tasks (task_name, task_due, task_desc) values (%s,%s,%s)",(taskName,taskDue,taskDesc))
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
            cursor.execute("insert into reminders (reminder, remind_time) values (%s,%s)",(reminder,remind_time))
            cursor.execute("select id from reminders order by id desc limit 1")
            reminderID = cursor.fetchone()
            cursor.execute("insert into tasks_reminders values (%s,%s)",(taskID,reminderID))
            conn.commit()
        return "done", 200
    else:
        return "invalid request",404

