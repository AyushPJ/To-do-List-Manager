from flask import Blueprint
from flask import render_template, request, redirect, url_for, jsonify

from flask import g


from . import db


bp = Blueprint("addTasks", "addTasks", url_prefix="/addTasks")



@bp.route("/", methods=["POST"])
def addTask(): 
    if request.method == "POST":
        formData = request.json['formData']
        print(formData)
    return  "done"





