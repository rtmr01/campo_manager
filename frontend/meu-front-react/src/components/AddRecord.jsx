// src/components/AddRecord.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddRecord.css';
import { IoCameraOutline, IoSave, IoChevronDown } from 'react-icons/io5';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:5000'
});

function AddRecord() {
  const [folders, setFolders] = useState([]);
  const navigate = useNavigate();

  // States para os campos
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState('');
  const [dimValue, setDimValue] = useState('');
  const [dimUnit, setDimUnit] = useState('');
  const [obs, setObs] = useState('');

  // States para os arquivos
  const [fotoJusante, setFotoJusante] = useState(null);
  const [fotoMontante, setFotoMontante] = useState(null);
  const [outrasFotos, setOutrasFotos] = useState(null);

  // NOVO: States para as prévias das fotos (Feature 3)
  const [previewJusante, setPreviewJusante] = useState(null);
  const [previewMontante, setPreviewMontante] = useState(null);

  // Busca pastas para o <select>
  useEffect(() => {
    apiClient.get('/api/dashboard').then(res => {
      setFolders(res.data.folders);
      if (res.data.folders.length > 0) {
        setFolderId(res.data.folders[0].id); // Seleciona a primeira
      }
    });
    
    // NOVO: Função de limpeza para revogar URLs de preview quando o componente for desmontado
    return () => {
      if (previewJusante) URL.revokeObjectURL(previewJusante);
      if (previewMontante) URL.revokeObjectURL(previewMontante);
    };
  }, []);

  // NOVO: Função para manipular a mudança de arquivo e criar preview (Feature 3)
  const handleFileChange = (e, setFileState, setPreviewState) => {
    const file = e.target.files[0];
    
    // Revoga URL antiga
    setPreviewState(prevUrl => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return null;
    });

    if (file) {
      // Cria nova URL de preview
      const newUrl = URL.createObjectURL(file);
      setPreviewState(newUrl);
      // Define o arquivo para o estado de submissão
      setFileState(file);
    } else {
      setFileState(null);
    }
  };

  // NOVO: Função para manipular mudança de múltiplos arquivos
  const handleMultiFileChange = (e, setFilesState) => {
    const files = e.target.files;
    if (files.length > 0) {
        setFilesState(files);
    } else {
        setFilesState(null);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fotoJusante || !fotoMontante) {
      alert('Fotos Jusante e Montante são obrigatórias.');
      return;
    }

    const formData = new FormData();
    formData.append('folder_id', folderId);
    formData.append('name', name);
    formData.append('dim_value', dimValue);
    formData.append('dim_unit', dimUnit);
    formData.append('obs', obs);
    
    formData.append('foto_jusante', fotoJusante);
    formData.append('foto_montante', fotoMontante);
    
    if (outrasFotos) {
      for (let i = 0; i < outrasFotos.length; i++) {
        formData.append('outras_fotos', outrasFotos[i]);
      }
    }

    // (Opcional) Adicionar um estado de 'loading'
    apiClient.post('/api/add', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(response => {
      if (response.data.success) {
        navigate('/'); // Redireciona para o Dashboard
      }
    }).catch(err => {
      console.error(err);
      alert('Erro ao salvar registro.');
    });
  };

  // Helper para mostrar o nome do arquivo no "FileUploader"
  const getFileLabel = (file) => {
    if (file) return file.name;
    return "Toque para capturar";
  };
  
  const getMultiFileLabel = (files) => {
    if (files) return `${files.length} fotos selecionadas`;
    return "Toque para capturar";
  };

  return (
    <div className="add-record-container">
      <div className="form-header">
        <h3>Adicionar Novo Registro</h3>
        <p>Capture as fotos e preencha as informações da inspeção</p>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Bloco de Informações Básicas */}
        <div className="form-card">
          <label htmlFor="name">Nome da Inspeção *</label>
          <input 
            id="name" 
            type="text" 
            placeholder="Ex: Inspeção Tubo Principal - Rua A" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required 
          />
          
          <label htmlFor="folder_id">Pasta de Arquivo *</label>
          <div className="select-wrapper"> {/* Wrapper para o ícone do select */}
            <select 
              id="folder_id" 
              value={folderId} 
              onChange={(e) => setFolderId(e.target.value)}
              required
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <IoChevronDown className="select-icon" />
          </div>
        </div>

        {/* Bloco de Fotos */}
        <div className="form-card">
          
          {/* File Uploader Customizado - Jusante */}
          <label className="file-upload-label">Foto Jusante *</label>
          
          {/* Pré-visualização da imagem (Feature 3) */}
          {previewJusante && <img src={previewJusante} alt="Prévia Jusante" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} />}
          
          <label htmlFor="foto_jusante" className="file-uploader-box">
            <IoCameraOutline size={32} color="var(--text-light)" />
            <span>{getFileLabel(fotoJusante)}</span>
          </label>
          <input 
            id="foto_jusante" 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleFileChange(e, setFotoJusante, setPreviewJusante)} // Chamada modificada
            required
            hidden 
          />

          {/* File Uploader Customizado - Montante */}
          <label className="file-upload-label">Foto Montante *</label>
          
          {/* Pré-visualização da imagem (Feature 3) */}
          {previewMontante && <img src={previewMontante} alt="Prévia Montante" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} />}

          <label htmlFor="foto_montante" className="file-uploader-box">
            <IoCameraOutline size={32} color="var(--text-light)" />
            <span>{getFileLabel(fotoMontante)}</span>
          </label>
          <input 
            id="foto_montante" 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleFileChange(e, setFotoMontante, setPreviewMontante)} // Chamada modificada
            required
            hidden 
          />

          {/* File Uploader Customizado - Outras */}
          <label className="file-upload-label">Outras Fotos</label>
          <label htmlFor="outras_fotos" className="file-uploader-box">
            <IoCameraOutline size={32} color="var(--text-light)" />
            <span>{getMultiFileLabel(outrasFotos)}</span>
          </label>
          <input 
            id="outras_fotos" 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleMultiFileChange(e, setOutrasFotos)} // Chamada modificada
            multiple
            hidden 
          />
        </div>

        {/* Bloco de Dimensões */}
        <div className="form-card">
          <label>Dimensões *</label>
          <div className="dimension-inputs">
            <input 
              type="number" 
              placeholder="Valor"
              value={dimValue}
              onChange={(e) => setDimValue(e.target.value)}
              required
            />
            <input 
              type="text" 
              placeholder="Unidade (ex: mm, m)"
              value={dimUnit}
              onChange={(e) => setDimUnit(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Bloco de Observações */}
        <div className="form-card">
          <label htmlFor="obs">Observações</label>
          <textarea 
            id="obs"
            rows="4" 
            placeholder="Adicione observações sobre a inspeção"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          ></textarea>
        </div>

        {/* Botão Salvar Fixo (ou não) - na imagem, ele está no fim do scroll */}
        <button type="submit" className="button-save">
          <IoSave size={20} />
          Salvar Registro
        </button>

      </form>
    </div>
  );
}

export default AddRecord;