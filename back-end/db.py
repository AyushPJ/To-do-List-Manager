import psycopg2

import click 
from flask import current_app, g
from flask.cli import with_appcontext

def get_db():
    if 'db' not in g: # If we've not initialised the database, then
                      # initialise it
        # Notice how we take the name of the database from the
        # config. We initialised this in the __init__.py file.
        dbname = current_app.config['DATABASE'] 
        g.db = psycopg2.connect(f"dbname={dbname}")
    return g.db


def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()

def init_db():
    db = get_db()
    f = current_app.open_resource("sql/000_create.sql")
    sql_code = f.read().decode("ascii")
    cur = db.cursor()
    cur.execute(sql_code)
    cur.close()
    db.commit()
    close_db()

# All flask commands cannot be run separately. If we simply import this file and try to run things, it will not work since flask creates a "context" for everything to run (e.g. g, current_app etc.). The with_appcontext decorator adds this context before running the init_db_command
@click.command('initdb', help="initialise the database") # If we run "flask initdb", this function will run.
@with_appcontext
def init_db_command():
    init_db()
    click.echo('DB initialised') # This the click library API to print a message on the screen


# All commands and other things need to be registered into the
# application. We write a function here that can be called inside
# __init__.py which will add the init_db_command to the CLI. If you
# run flask --help now, you will see the initidb command there. Also,
# we add a "hook" to automatically call close_db when the app finishes
# execution. This will make sure that database connections are closed
# when done.
def init_app(app):
    app.teardown_appcontext(close_db) #hook
    app.cli.add_command(init_db_command)

