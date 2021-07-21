import re
import datetime
from typing import Tuple
from flask import Blueprint
from flask import render_template, request, redirect, url_for, jsonify

from flask import g


from . import db


bp = Blueprint("reminders", "reminders", url_prefix="/reminders")


@bp.route("/deleteReminders", methods=["POST"])
def deleteReminders():
    if request.method == "POST":
        tasksReminders = request.json["tasksReminders"]
        for taskReminder in tasksReminders:
            reminder = taskReminder["reminder"]
            reminderID = reminder["id"]
            conn = db.get_db()
            cursor = conn.cursor()
            cursor.execute("delete from reminders r where id=%s",(reminderID,))
            conn.commit()
        return "done", 200
    else:
        return "invalid request",404

