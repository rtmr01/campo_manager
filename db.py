from flask_mysqldb import MySQL
from flask import Flask

app = Flask(__name__)
app.config["MYSQL_HOST"] = "localhost"
app.config["MYSQL_USER"] = "root"
app.config["MYSQL_PASSWORD"] = "rodrigo09!"
app.config["MYSQL_DB"] = "campo_manager"
app.config["MYSQL_CURSORCLASS"] = "DictCursor"

mysql = MySQL(app)
