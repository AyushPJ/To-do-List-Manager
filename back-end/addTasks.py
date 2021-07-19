import re
import datetime
from flask import Blueprint
from flask import render_template, request, redirect, url_for, jsonify

from flask import g


from . import db


bp = Blueprint("addTasks", "addTasks", url_prefix="/addTasks")


@bp.route("/", methods=["POST"])
def addTask():
    if request.method == "POST":
        formData = request.json["formData"]
        taskName = formData["taskName"]
        taskStart = formData["taskStart"]
        tags = formData["tags"]
        reminders = formData["reminders"]
        taskDesc = formData["taskDesc"]
        taskStart = datetime.datetime.strptime(taskStart[0:-5], "%Y-%m-%dT%H:%M:%S")
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute("insert into tasks (task_name, task_start, task_desc) values (%s,%s,%s)",(taskName,taskStart,taskDesc))
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
