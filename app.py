from flask import request, jsonify 
from werkzeug.utils import secure_filename
from db import app, mysql 
from flask_cors import CORS
CORS(app) 

import os
import json
import io 

try:
    from fpdf import FPDF
except ImportError:
    FPDF = None

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


@app.route("/api/dashboard")
# ... (outras rotas) ...

@app.route("/api/delete/<int:id>")
def delete_record_api(id):
    """
    Exclui um registro de inspeção.
    """
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM inspections WHERE id=%s", [id])
    mysql.connection.commit()
    
    return jsonify(success=True, message="Registro excluído com sucesso")


@app.route("/api/inspection/pdf/<int:id>")
def download_pdf_api(id):
    """
    Gera e retorna um relatório PDF para uma inspeção específica.
    """
    if FPDF is None:
        return jsonify(
            success=False, 
            message="Erro no servidor: A biblioteca FPDF (fpdf2) não está instalada ou configurada."
        ), 500
        
    cur = mysql.connection.cursor()
    
    cur.execute("""
        SELECT i.*, f.name AS folder_name
        FROM inspections i
        LEFT JOIN folders f ON i.folder_id=f.id
        WHERE i.id = %s
    """, [id])
    inspection_data = cur.fetchone()
    cur.close()

    if not inspection_data:
        return jsonify(success=False, message="Inspeção não encontrada"), 404

    try:
        pdf = FPDF()
        pdf.add_page()
        
        pdf.set_font("Arial", style='B', size=16)
        pdf.cell(0, 10, txt="Relatório de Inspeção", ln=True, align='C')
        pdf.set_font("Arial", size=12)
        pdf.ln(5)
        
        pdf.cell(0, 7, txt=f"ID do Registro: #{inspection_data['id']}", ln=True)
        pdf.cell(0, 7, txt=f"Pasta: {inspection_data['folder_name']}", ln=True)
        pdf.cell(0, 7, txt=f"Nome: {inspection_data['name']}", ln=True)
        
        created_at_str = inspection_data['created_at'].strftime('%d/%m/%Y %H:%M')
        pdf.cell(0, 7, txt=f"Data: {created_at_str}", ln=True)

        pdf.ln(5)
        pdf.set_font("Arial", style='B', size=12)
        pdf.cell(0, 7, txt="Dimensões:", ln=True)
        pdf.set_font("Arial", size=12)
        pdf.cell(0, 7, txt=f"Valor: {inspection_data['dimensions_value']} {inspection_data['dimensions_unit']}", ln=True)

        pdf.ln(5)
        pdf.set_font("Arial", style='B', size=12)
        pdf.cell(0, 7, txt="Observações:", ln=True)
        pdf.set_font("Arial", size=12)
        pdf.multi_cell(0, 5, txt=inspection_data['observations'] or 'N/A')
        pdf.ln(5)

        pdf.set_font("Arial", style='B', size=12)
        pdf.cell(0, 7, txt="Fotos:", ln=True)
        pdf.ln(2)
        
        photo_paths = [
            ("Foto Jusante", inspection_data['jusante_photo']),
            ("Foto Montante", inspection_data['montante_photo'])
        ]
        
        other_photos = json.loads(inspection_data['other_photos']) if inspection_data['other_photos'] else []
        for i, path in enumerate(other_photos):
            photo_paths.append((f"Outra Foto {i+1}", path))
            
        for label, path in photo_paths:
            full_path = os.path.join(app.root_path, path)
            pdf.set_font("Arial", style='B', size=10)
            pdf.cell(0, 5, txt=f"{label}:", ln=True)
            
            if os.path.exists(full_path):
                try:
                    pdf.image(full_path, w=80) 
                except Exception:
                     pdf.set_text_color(255, 0, 0) # Red
                     pdf.cell(0, 5, txt=f"Erro ao carregar {label}.", ln=True)
                     pdf.set_text_color(0, 0, 0) # Black
                pdf.ln(5)
            else:
                pdf.set_font("Arial", size=10)
                pdf.cell(0, 5, txt="Caminho do arquivo não encontrado.", ln=True)
                pdf.ln(5)

        pdf_output = pdf.output(dest='S').encode('latin-1')
        
        response = app.response_class(
            pdf_output, 
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment;filename=relatorio_inspecao_{id}.pdf',
                'Content-Length': len(pdf_output)
            }
        )
        return response

    except Exception as e:
        mysql.connection.rollback()
        return jsonify(success=False, message=f"Erro ao gerar PDF: {str(e)}"), 500



if __name__ == "__main__":
    app.run(debug=True, port=5000)