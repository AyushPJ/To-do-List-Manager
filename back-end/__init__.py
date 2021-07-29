from datetime import datetime
from datetime import timedelta
from datetime import timezone


from flask import Flask, request, jsonify
from flask_cors import CORS
from pytz import utc

from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash

from flask_jwt_extended import create_access_token
from flask_jwt_extended import current_user
from flask_jwt_extended import jwt_required
from flask_jwt_extended import get_jwt
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import JWTManager
from flask_jwt_extended import set_access_cookies
from flask_jwt_extended import unset_jwt_cookies

def create_app():
    app = Flask("To-do List Manager")
    CORS(app)

    app.config.from_mapping(
        DATABASE="App-TLM",
        SCHEDULER_API_ENABLED = True,
        SCHEDULER_TIMEZONE = utc,
        SCHEDULER_JOB_DEFAULTS = {'max_instances': 11},
        SECRET_KEY="dev",
        JWT_SECRET_KEY = "super-secret",
        JWT_COOKIE_SECURE = False,
        JWT_TOKEN_LOCATION = "cookies",
        JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1),
    )
    
    from . import tasks
    app.register_blueprint(tasks.bp)

    from . import reminders
    app.register_blueprint(reminders.bp)

    from . import pushNotifications
    app.register_blueprint(pushNotifications.bp)



    from .scheduler import scheduler
    if(not scheduler.running):   
        scheduler.init_app(app)
        scheduler.start()
    
    
    jwt = JWTManager(app)
    
    from . import db 
    db.init_app(app)


    @app.after_request
    def refresh_expiring_jwts(response):
        try:
            exp_timestamp = get_jwt()["exp"]
            now = datetime.now(timezone.utc)
            target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
            if target_timestamp > exp_timestamp:
                access_token = create_access_token(identity=get_jwt_identity())
                set_access_cookies(response, access_token)
            return response
        except (RuntimeError, KeyError):
            # Case where there is not a valid JWT. Just return the original respone
            return response
    

    @jwt.user_identity_loader
    def user_identity_lookup(userID):
        return userID

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        id = jwt_data['sub']
        conn=db.get_db()
        cursor = conn.cursor()
        cursor.execute("select id, username from users where id=%s",(id,))
        return cursor.fetchone()
    
    @app.route("/login", methods=["POST"])
    def login():
        username = request.json.get("username", None)
        password = request.json.get("password", None)
        conn = db.get_db()
        cursor=conn.cursor()
        cursor.execute("select id,username,password from users where username = %s",(username,))
        user = cursor.fetchone()
        if user == None:
            return jsonify({"msg": "Bad username or password"}), 401
        userID=user[0]
        username = user[1]
        hashedPass = user[2]
        if not check_password_hash(hashedPass,password):
            return jsonify({"msg": "Bad username or password"}), 401
        access_token = create_access_token(identity=userID)
        response = jsonify(access_token=access_token)
        set_access_cookies(response, access_token)
        return response
    
    @app.route("/register", methods=["POST"])
    def register():
        username = request.json.get("username", None)
        password = request.json.get("password", None)
        conn = db.get_db()
        cursor=conn.cursor()
        cursor.execute("select count(*) from users where username = %s",(username,))
        if not cursor.fetchone()[0] == 0:
            return jsonify({"msg": "Username already taken"}) ,409
        
        hashedPass = generate_password_hash(password)
        cursor.execute("insert into users (username,password,push_notification_subscription_details) values (%s,%s,'')",(username,hashedPass))
        conn.commit()
        return 'ok',200

    @app.route("/isAuthorized")
    @jwt_required()
    def isAuthorized():
        return jsonify({'msg':f'logged in as {current_user[0]}'})

    @app.route("/logout", methods=["POST"])
    def logout():
        response = jsonify({"msg": "logout successful"})
        unset_jwt_cookies(response)
        return response
    
        

    return app
    

    