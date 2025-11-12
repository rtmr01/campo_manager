# Importações necessárias do Flask
from flask import request, jsonify 
from werkzeug.utils import secure_filename
from db import app, mysql 
from flask_cors import CORS
CORS(app) 

import os
import json

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER



@app.route("/api/dashboard")
def dashboard_api():
    """
    Fornece todos os dados necessários para o dashboard inicial:
    pastas e inspeções.
    """
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

    return jsonify(folders=folders, inspections=inspections)


@app.route("/api/folder", methods=["POST"])
def create_folder_api():
    """
    Cria uma nova pasta. Recebe 'folder_name' de um FormData.
    """
    name = request.form["folder_name"]
    cur = mysql.connection.cursor()
    cur.execute("INSERT INTO folders (name) VALUES (%s)", [name])
    mysql.connection.commit()
    
    return jsonify(success=True, message="Pasta criada com sucesso")


@app.route("/api/folder/delete/<int:id>")
def delete_folder_api(id):
    """
    Exclui uma pasta E TODAS as inspeções dentro dela (exclusão em cascata).
    """
    try:
        cur = mysql.connection.cursor()
        
        cur.execute("DELETE FROM inspections WHERE folder_id = %s", [id])
        
        cur.execute("DELETE FROM folders WHERE id = %s", [id])
        
        mysql.connection.commit()
        
        return jsonify(success=True, message="Pasta e todos os registros excluídos com sucesso")
    
    except Exception as e:
        mysql.connection.rollback() 
        return jsonify(success=False, message=str(e)), 500


@app.route("/api/add", methods=["POST"])
def add_record_api():
    """
    Adiciona um novo registro de inspeção.
    A lógica de recebimento (FormData e arquivos) é IDÊNTICA 
    à do seu 'add_record' original, pois o React está enviando
    os dados no mesmo formato (multipart/form-data).
    """
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

    cur = mysql.connection.cursor()
    cur.execute("""
        INSERT INTO inspections
        (folder_id, name, jusante_photo, montante_photo, other_photos,
         dimensions_value, dimensions_unit, observations)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, [folder_id, name, jusante_path, montante_path, json.dumps(other_paths), value, unit, obs])

    mysql.connection.commit()
    
    return jsonify(success=True, message="Registro salvo com sucesso")


@app.route("/api/delete/<int:id>")
def delete_record_api(id):
    """
    Exclui um registro de inspeção.
    """
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM inspections WHERE id=%s", [id])
    mysql.connection.commit()
    
    return jsonify(success=True, message="Registro excluído com sucesso")


if __name__ == "__main__":
    app.run(debug=True, port=5000) 