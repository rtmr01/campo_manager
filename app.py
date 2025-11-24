from flask import request, jsonify 
from werkzeug.utils import secure_filename
from db import app, mysql 
from flask_cors import CORS
CORS(app) 

import os
import json
import io 
from datetime import datetime

try:
    from fpdf import FPDF
    # Tentativa de importar XPos e YPos para remover DeprecationWarnings
    try:
        from fpdf import XPos, YPos
    except ImportError:
        # Fallback para versões mais antigas
        class XPos: LMARGIN = 'L'
        class YPos: NEXT = 'Y'

except ImportError:
    FPDF = None


UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


@app.route("/api/dashboard")
def dashboard_api():
    """Retorna a lista de pastas e inspeções para o dashboard (GET)."""
    cur = mysql.connection.cursor()
    
    # 1. Buscar todas as pastas
    cur.execute("SELECT id, name FROM folders ORDER BY name")
    folders = cur.fetchall()

    # 2. Buscar todas as inspeções, incluindo o nome da pasta
    cur.execute("""
        SELECT 
            i.id, i.name, i.created_at, i.dimensions_value, i.dimensions_unit, 
            f.name AS folder_name
        FROM inspections i
        JOIN folders f ON i.folder_id = f.id
        ORDER BY i.created_at DESC
    """)
    inspections = cur.fetchall()
    cur.close()

    return jsonify(folders=folders, inspections=inspections)


@app.route("/api/folder", methods=["POST"])
def create_folder_api():
    """Cria uma nova pasta de arquivos (POST)."""
    folder_name = request.form.get("folder_name")
    if not folder_name:
        return jsonify(success=False, message="Nome da pasta é obrigatório"), 400
        
    cur = mysql.connection.cursor()
    
    # Validação simples para evitar pastas duplicadas
    cur.execute("SELECT id FROM folders WHERE name = %s", [folder_name])
    if cur.fetchone():
        cur.close()
        return jsonify(success=False, message="Pasta já existe"), 409
        
    cur.execute("INSERT INTO folders (name) VALUES (%s)", [folder_name])
    mysql.connection.commit()
    cur.close()
    
    return jsonify(success=True, message="Pasta criada com sucesso")


@app.route("/api/folder/delete/<int:folderId>")
def delete_folder_api(folderId):
    """Exclui uma pasta e todos os registros de inspeção associados a ela (GET)."""
    cur = mysql.connection.cursor()
    
    # Excluir registros de inspeção primeiro
    cur.execute("DELETE FROM inspections WHERE folder_id=%s", [folderId])
    
    # Excluir a pasta
    cur.execute("DELETE FROM folders WHERE id=%s", [folderId])
    
    mysql.connection.commit()
    cur.close()
    
    return jsonify(success=True, message="Pasta e registros excluídos com sucesso")


@app.route("/api/add", methods=["POST"])
def add_record_api():
    """Adiciona um novo registro de inspeção com upload de arquivos (POST)."""
    try:
        cur = mysql.connection.cursor()
        
        # Dados de texto
        folder_id = request.form.get('folder_id')
        name = request.form.get('name')
        dim_value = request.form.get('dim_value')
        dim_unit = request.form.get('dim_unit')
        obs = request.form.get('obs')

        # Funções para salvar arquivos
        def save_file(file):
            if file:
                filename = secure_filename(file.filename)
                # Adiciona um timestamp/UUID ao nome para evitar colisões
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                base, ext = os.path.splitext(filename)
                safe_filename = f"{base}_{timestamp}{ext}"
                
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
                file.save(file_path)
                # Retorna o caminho relativo (static/uploads/...) para salvar no DB
                return f"static/uploads/{safe_filename}"
            return None

        # Salvar arquivos principais (obrigatórios)
        foto_jusante_file = request.files.get('foto_jusante')
        foto_montante_file = request.files.get('foto_montante')

        jusante_path = save_file(foto_jusante_file)
        montante_path = save_file(foto_montante_file)
        
        if not jusante_path or not montante_path:
            # Tenta limpar arquivos se um falhar
            if jusante_path and os.path.exists(os.path.join(app.root_path, jusante_path)): 
                os.remove(os.path.join(app.root_path, jusante_path))
            if montante_path and os.path.exists(os.path.join(app.root_path, montante_path)): 
                os.remove(os.path.join(app.root_path, montante_path))
            return jsonify(success=False, message="Fotos Jusante e Montante são obrigatórias"), 400

        # Salvar outras fotos (opcional, lista)
        outras_fotos_files = request.files.getlist('outras_fotos')
        other_photos_paths = [save_file(f) for f in outras_fotos_files if f and f.filename]

        # Inserir no banco de dados
        cur.execute("""
            INSERT INTO inspections (
                folder_id, name, dimensions_value, dimensions_unit, 
                observations, jusante_photo, montante_photo, other_photos
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            folder_id, name, dim_value, dim_unit, 
            obs, jusante_path, montante_path, json.dumps(other_photos_paths)
        ))
        
        mysql.connection.commit()
        cur.close()
        
        return jsonify(success=True, message="Registro criado com sucesso")

    except Exception as e:
        mysql.connection.rollback()
        print(f"Erro ao adicionar registro: {e}")
        return jsonify(success=False, message=f"Erro no servidor: {str(e)}"), 500


@app.route("/api/delete/<int:id>")
def delete_record_api(id):
    """
    Exclui um registro de inspeção (GET).
    """
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM inspections WHERE id=%s", [id])
    mysql.connection.commit()
    
    return jsonify(success=True, message="Registro excluído com sucesso")


@app.route("/api/inspection/pdf/<int:id>")
def download_pdf_api(id):
    """
    Gera e retorna um relatório PDF para uma inspeção específica, com tratamento de erros de imagem.
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
        
        # --- Configuração do PDF e Conteúdo ---
        pdf.set_font("Arial", style='B', size=16)
        pdf.cell(0, 10, text="Relatório de Inspeção", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
        pdf.set_font("Arial", size=12)
        pdf.ln(5)
        
        # Inserção de dados com tratamento para caracteres especiais/tipos
        pdf.cell(0, 7, text=f"ID do Registro: #{str(inspection_data['id'])}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 7, text=f"Pasta: {str(inspection_data['folder_name'])}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 7, text=f"Nome: {str(inspection_data['name'])}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        created_at = inspection_data.get('created_at')
        if created_at and hasattr(created_at, 'strftime'):
             created_at_str = created_at.strftime('%d/%m/%Y %H:%M')
        else:
             created_at_str = str(created_at)

        pdf.cell(0, 7, text=f"Data: {created_at_str}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(5)
        pdf.set_font("Arial", style='B', size=12)
        pdf.cell(0, 7, text="Dimensões:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("Arial", size=12)
        dim_text = f"Valor: {str(inspection_data['dimensions_value'])} {str(inspection_data['dimensions_unit'])}"
        pdf.cell(0, 7, text=dim_text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(5)
        pdf.set_font("Arial", style='B', size=12)
        pdf.cell(0, 7, text="Observações:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("Arial", size=12)
        pdf.multi_cell(0, 5, text=str(inspection_data['observations'] or 'N/A'))
        pdf.ln(5)

        pdf.set_font("Arial", style='B', size=12)
        pdf.cell(0, 7, text="Fotos:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)
        
        photo_paths = [
            ("Foto Jusante", inspection_data['jusante_photo']),
            ("Foto Montante", inspection_data['montante_photo'])
        ]
        
        other_photos = json.loads(inspection_data['other_photos']) if inspection_data['other_photos'] else []
        for i, path in enumerate(other_photos):
            photo_paths.append((f"Outra Foto {i+1}", path))
            
        # --- Bloco de Tratamento de Erro de Imagem Aprimorado com Log Detalhado ---
        for label, path in photo_paths:
            if not path:
                continue

            full_path = os.path.join(app.root_path, path)
            pdf.set_font("Arial", style='B', size=10)
            pdf.cell(0, 5, text=f"{label}:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            
            if os.path.exists(full_path):
                try:
                    pdf.image(full_path, w=80) 
                    pdf.ln(5)
                except Exception as img_e:
                     # LOG DETALHADO DA EXCEÇÃO:
                     print(f"ERRO DE IMAGEM (FATAL): Falha ao carregar a imagem '{label}' no caminho '{full_path}'. Erro: {img_e}")
                     
                     pdf.set_text_color(255, 0, 0) # Red
                     pdf.set_font("Arial", size=10)
                     pdf.cell(0, 5, text=f"Erro: Não foi possível carregar {label}. Verifique o formato (JPEG, PNG).", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                     pdf.set_text_color(0, 0, 0) # Black
                     pdf.ln(5)
            else:
                pdf.set_font("Arial", size=10)
                pdf.cell(0, 5, text="Caminho do arquivo não encontrado.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(5)
        # --------------------------------------------------------
        
        # CORREÇÃO FINAL E ROBUSTA: Garante que o Flask receba bytes, não importa o que o fpdf2 retorne.
        pdf_output_raw = pdf.output(dest='S')
        
        if isinstance(pdf_output_raw, str):
            # Se for string, codifica para bytes
            pdf_output = pdf_output_raw.encode('latin-1')
        elif isinstance(pdf_output_raw, (bytes, bytearray)):
            # Se já for bytes ou bytearray, garante que seja bytes puros
            pdf_output = bytes(pdf_output_raw)
        else:
             # Caso inesperado, levanta erro que será pego pelo bloco exterior
             raise TypeError(f"A saída do PDF tem um tipo inesperado: {type(pdf_output_raw)}")
        
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
        # Retorna o erro 500 para o frontend
        print(f"ERRO GERAL NO DOWNLOAD PDF: {e}")
        return jsonify(success=False, message=f"Erro ao gerar PDF: {str(e)}"), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)