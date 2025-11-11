from flask import render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
from db import app, mysql
import os
import json

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/")
def home():
    return redirect(url_for("dashboard"))

@app.route("/dashboard")
def dashboard():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM folders")
    folders = cur.fetchall()

    cur.execute("""
        SELECT i.id, i.name, i.dimensions_value, i.dimensions_unit,
               i.created_at, f.name AS folder_name
        FROM inspections i
        LEFT JOIN folders f ON i.folder_id=f.id
        ORDER BY i.created_at DESC
    """)
    inspections = cur.fetchall()

    return render_template("dashboard.html", folders=folders, inspections=inspections)

@app.route("/folder", methods=["POST"])
def create_folder():
    name = request.form["folder_name"]
    cur = mysql.connection.cursor()
    cur.execute("INSERT INTO folders (name) VALUES (%s)", [name])
    mysql.connection.commit()
    return redirect(url_for("dashboard"))

@app.route("/folder/delete/<int:id>")
def delete_folder(id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM folders WHERE id=%s", [id])
    mysql.connection.commit()
    return redirect(url_for("dashboard"))

@app.route("/add", methods=["GET", "POST"])
def add_record():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM folders")
    folders = cur.fetchall()

    if request.method == "POST":
        folder_id = request.form["folder_id"]
        name = request.form["name"]
        value = request.form["dim_value"]
        unit = request.form["dim_unit"]
        obs = request.form["obs"]

        jusante = request.files["foto_jusante"]
        montante = request.files["foto_montante"]
        others = request.files.getlist("outras_fotos")

        jusante_path = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(jusante.filename))
        montante_path = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(montante.filename))
        jusante.save(jusante_path)
        montante.save(montante_path)

        other_paths = []
        for f in others:
            if f.filename:
                p = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(f.filename))
                f.save(p)
                other_paths.append(p)

        cur.execute("""
            INSERT INTO inspections
            (folder_id, name, jusante_photo, montante_photo, other_photos,
             dimensions_value, dimensions_unit, observations)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, [folder_id, name, jusante_path, montante_path, json.dumps(other_paths), value, unit, obs])

        mysql.connection.commit()
        return redirect(url_for("dashboard"))

    return render_template("add_record.html", folders=folders)

@app.route("/delete/<int:id>")
def delete_record(id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM inspections WHERE id=%s", [id])
    mysql.connection.commit()
    return redirect(url_for("dashboard"))

if __name__ == "__main__":
    app.run(debug=True)
