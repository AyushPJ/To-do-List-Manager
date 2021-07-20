from flask import Flask, render_template
from flask_cors import CORS

def create_app():
    app = Flask("To-do List Manager")
    CORS(app)

    app.config.from_mapping(
        DATABASE="App-TLM"
    )
    
    from . import tasks
    app.register_blueprint(tasks.bp)

    from . import db 
    db.init_app(app) 

    @app.route("/")
    def index():
        return render_template('addTask.html')

    return app
    
