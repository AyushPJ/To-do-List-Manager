
from flask import Blueprint
from flask import app, request, jsonify, current_app
from flask_jwt_extended import current_user

import json, os
from flask_jwt_extended.view_decorators import jwt_required

from pywebpush import webpush,WebPushException


from . import db
from . import reminders as Reminders
bp = Blueprint("pushNotifications", "pushNotifications", url_prefix="/pushNotifications")

DER_BASE64_ENCODED_PRIVATE_KEY_FILE_PATH = os.path.join(os.getcwd(),"private_key.txt")
DER_BASE64_ENCODED_PUBLIC_KEY_FILE_PATH = os.path.join(os.getcwd(),"public_key.txt")

VAPID_PRIVATE_KEY = open(DER_BASE64_ENCODED_PRIVATE_KEY_FILE_PATH, "r+").readline().strip("\n")
VAPID_PUBLIC_KEY = open(DER_BASE64_ENCODED_PUBLIC_KEY_FILE_PATH, "r+").read().strip("\n")

VAPID_CLAIMS = {
"sub": "mailto:pjayush@gmail.com"
}

@bp.route("/getApplicationServerPublicKey",)
@jwt_required()
def getApplicationServerPublicKey():
    return jsonify({'Application-Server-Public-Key': VAPID_PUBLIC_KEY})

def isValidSaveRequest(req):
    if not req.data or not req.get_json()['endpoint']:
        return False
    return True

def send_web_push(subscription_information, message_body):
    return webpush(
        subscription_info=subscription_information,
        data=message_body,
        vapid_private_key=VAPID_PRIVATE_KEY,
        vapid_claims=VAPID_CLAIMS
    )     

@bp.route("/save-subscription", methods=['POST'])
@jwt_required()
def saveSubscription():
    userID= current_user[0]
    if not isValidSaveRequest(request):
        return(jsonify(dict(error = dict(id='no-endpoint', message= 'Subscription must have an endpoint')))), 400
    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute("update users set push_notification_subscription_details = %s where id = %s",(json.dumps(request.get_json()),userID))
    conn.commit()
    return(jsonify((dict(data= dict(success= True)))))

@bp.route("/delete-subscription", methods=['POST'])
@jwt_required()
def deleteSubscription():
    userID= current_user[0]
    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute("update users set push_notification_subscription_details = '' where id = %s",(userID,))
    conn.commit()
    return(jsonify((dict(data= dict(success= True)))))

@bp.route("/get-subscription-status")
@jwt_required()
def getSubscriptionStatus():
    userID= current_user[0]
    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute("select push_notification_subscription_details from users where id = %s",(userID,))
    return(jsonify((dict(data= dict(status= (not cursor.fetchone()[0] == ''))))))

from .scheduler import scheduler
def pushReminder(ID, category):
    with scheduler.app.app_context():
        conn=db.get_db()
        cursor=conn.cursor()
        data = {}
        print(ID,category)
        if category=='reminder':
            cursor.execute("select reminder from reminders where id = %s",(ID,))
            reminder = cursor.fetchone()[0]
            cursor.execute("select t.id, t.task_name, t.task_due, t.task_desc, t.task_status from tasks t, tasks_reminders tr where tr.task_id=t.id and tr.reminder_id = %s",(ID,))
            task = cursor.fetchone()
            data = dict(task=dict(id=task[0], taskName=task[1], taskDue=task[2].strftime("%d/%m/%Y %H:%M:%S"), taskDesc=task[3],taskStatus = task[4], reminder = reminder),category='reminder')
            cursor.execute("delete from reminders where id = %s",(ID,))

        elif category=='overdue':
            cursor.execute("update tasks set task_status='overdue' where id= %s",(ID,))
            cursor.execute("select t.id, t.task_name, t.task_due, t.task_desc, t.task_status from tasks t where t.id = %s",(ID,))
            task = cursor.fetchone()
            data = dict(task=dict(id=task[0], taskName=task[1], taskDue=task[2].strftime("%d/%m/%Y %H:%M:%S"), taskDesc=task[3],taskStatus = task[4]),category='overdue')

        conn.commit()
        cursor.execute("select push_notification_subscription_details from users u, users_tasks ut where u.id=ut.user_id and ut.task_id = %s",(task[0],))
        subDetails = cursor.fetchone()[0]
        current_app.config['SCHEDULED_JOBS'] -= 1 
        if current_app.config['SCHEDULED_JOBS'] == 0:
                Reminders.scheduleNextReminder()
        if subDetails=='':
            return jsonify({'msg':'Subscription details missing'}) , 400
        
        try:
            token = json.loads(subDetails)
            print(send_web_push(token , json.dumps(data)))
            return jsonify((dict(data= dict(success= True))))
        except Exception as e:
            print("error",e)
            return jsonify({'failed':str(e)})


@bp.route("/trigger-push-msg", methods=['POST'])
@jwt_required()
def triggerPushMsg():
    userID= current_user[0]
    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute("select push_notification_subscription_details from users where id = %s",(userID,))
    subDetails = cursor.fetchone()[0]

    if subDetails == '':
        return jsonify({'msg':'Subscription details missing.'}), 400

    try:
        token = json.loads(subDetails)
        print(send_web_push(token ,json.dumps({'category':'test','msg':'Hello there! If you see this notification, your setup is working correctly.'})))
        return jsonify((dict(data= dict(success= True))))
    except Exception as e:
        print("error",e)
        return jsonify({'msg':'Subsciption invalid.','failed':str(e)}), 400

