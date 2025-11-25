// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import { 
  IoAdd, 
  IoChevronDown, 
  IoChevronUp, 
  IoCalendarClearOutline, 
  IoResize, 
  IoImageOutline, 
  IoPencil, 
  IoTrash,
  IoDocumentTextOutline,
  IoAlbumsOutline 
} from 'react-icons/io5';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:5000' 
});


function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [openFolder, setOpenFolder] = useState(null); 

  const fetchData = () => {
    // ... (restante da função fetchData)
    apiClient.get('/api/dashboard')
      .then(response => {
        setFolders(response.data.folders);
        setInspections(response.data.inspections);
        
        if (!openFolder && response.data.folders.length > 0) {
            setOpenFolder(response.data.folders[0].name);
        }
      })
      .catch(error => console.error("Erro ao buscar dados:", error));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFolder = (e) => {
    // ... (restante da função handleCreateFolder)
    e.preventDefault();
    if (!newFolderName) return;
    
    const formData = new FormData();
    formData.append('folder_name', newFolderName);

    apiClient.post('/api/folder', formData).then(res => {
      if (res.data.success) {
        setNewFolderName('');
        fetchData();
      }
    });
  };

  const handleDeleteRecord = (id) => {
    // ... (restante da função handleDeleteRecord)
    if (window.confirm('Excluir este registro?')) {
      apiClient.get(`/api/delete/${id}`).then(fetchData); 
    }
  }

  const handleDeleteFolder = (e, folderId, folderName) => {
    // ... (restante da função handleDeleteFolder)
    e.stopPropagation(); 
    
    const confirmMessage = `Tem certeza que deseja excluir a pasta "${folderName}"?\n\nATENÇÃO: Todos os registros de inspeção dentro dela também serão permanentemente excluídos.`;

    if (window.confirm(confirmMessage)) {
      apiClient.get(`/api/folder/delete/${folderId}`)
        .then(res => {
          if (res.data.success) {
            fetchData(); 
          } else {
            alert("Erro ao excluir pasta.");
          }
        })
        .catch(err => {
          console.error("Erro ao excluir pasta:", err);
          alert("Erro ao excluir pasta.");
        });
    }
  };

  const handleDownloadPdf = (id, name) => {
    // ... (restante da função handleDownloadPdf)
    apiClient.get(`/api/inspection/pdf/${id}`, {
      responseType: 'blob' 
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      const link = document.createElement('a');
      link.href = url;
      const cleanName = name.replace(/\s/g, '_');
      link.setAttribute('download', `${cleanName}_relatorio.pdf`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    }).catch(error => {
      console.error("Erro ao baixar PDF:", error);
      alert('Erro ao gerar ou baixar o relatório PDF. Verifique o console ou o backend Flask. (Você instalou o "fpdf2"?).');
    });
  }
  
  // =================================================================
  // NOVAS FUNÇÕES DE DOWNLOAD (Features 1, 2, 4)
  // =================================================================

  // Feature 1: Baixar Fotos (ZIP/PNG)
  const handleDownloadPhotos = (id, name) => {
    apiClient.get(`/api/inspection/photos/${id}`, {
      responseType: 'blob' 
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      const link = document.createElement('a');
      link.href = url;
      const cleanName = name.replace(/\s/g, '_');
      link.setAttribute('download', `${cleanName}_fotos.zip`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    }).catch(error => {
      console.error("Erro ao baixar fotos:", error);
      alert('Erro ao gerar ou baixar o ZIP de fotos. Verifique o console ou o backend Flask. (Você instalou o "Pillow"?).');
    });
  }

  // Feature 2: Baixar Dados de Texto (CSV)
  const handleDownloadCsv = (id, name) => {
    apiClient.get(`/api/inspection/csv/${id}`, {
      responseType: 'blob' 
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      const link = document.createElement('a');
      link.href = url;
      const cleanName = name.replace(/\s/g, '_');
      link.setAttribute('download', `${cleanName}_dados.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    }).catch(error => {
      console.error("Erro ao baixar CSV:", error);
      alert('Erro ao gerar ou baixar o arquivo CSV. Verifique o console ou o backend Flask.');
    });
  }

  // Feature 4: Baixar Todos os PDFs de uma Pasta (ZIP)
  const handleDownloadFolderPdfs = (folderId, folderName) => {
    apiClient.get(`/api/folder/pdf/${folderId}`, {
      responseType: 'blob' 
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      const link = document.createElement('a');
      link.href = url;
      const cleanName = folderName.replace(/\s/g, '_');
      link.setAttribute('download', `${cleanName}_todos_relatorios.zip`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    }).catch(error => {
      console.error("Erro ao baixar PDFs da pasta:", error);
      alert('Erro ao gerar ou baixar o ZIP dos PDFs da pasta. Verifique o console ou o backend Flask.');
    });
  }

  // =================================================================
  // FIM DAS NOVAS FUNÇÕES
  // =================================================================
  
  const getInspectionsByFolder = (folderName) => {
    return inspections.filter(i => i.folder_name === folderName);
  };

  // --- Renderização ---
  return (
    <div className="dashboard-container">
      
      {/* Seção "Arquivos de Inspeção" (Formulário de criar pasta) */}
      <div className="card list-header">
        <div className="list-header-title">
          <h3>Arquivos de Inspeção</h3>
          <small>{inspections.length} registros encontrados</small>
        </div>
        
        <form onSubmit={handleCreateFolder} className="new-folder-form">
          <input 
            type="text" 
            placeholder="Nome da Nova Pasta"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <button type="submit" className="button-primary-icon">
            <IoAdd size={18} />
            Nova Pasta
          </button>
        </form>
      </div>

      {/* Lista de Pastas e Inspeções */}
      {folders.map(folder => {
        const inspectionsInFolder = getInspectionsByFolder(folder.name);
        const isOpen = openFolder === folder.name;

        return (
          <div className="folder-group" key={folder.id}>
            
            {/* Header da Pasta */}
            <div className="folder-header" onClick={() => setOpenFolder(isOpen ? null : folder.name)}>
              <div className="folder-title">
                {isOpen ? <IoChevronUp /> : <IoChevronDown />}
                <h3>{folder.name}</h3>
              </div>
              
              <div className="folder-header-right">
                
                {/* NOVO BOTÃO: Baixar Todos os PDFs da Pasta (Feature 4) */}
                {inspectionsInFolder.length > 0 && (
                  <button 
                    className="button-icon-pdf" /* Reutilizando o estilo do PDF individual */
                    onClick={(e) => {
                      e.stopPropagation(); // Evita fechar/abrir a pasta
                      handleDownloadFolderPdfs(folder.id, folder.name);
                    }}
                    title={`Baixar todos os ${inspectionsInFolder.length} PDFs da pasta`}
                  >
                    <IoAlbumsOutline size={16} />
                  </button>
                )}
                
                <span className="folder-count">{inspectionsInFolder.length} registros</span>
                <button 
                  className="button-icon-delete"
                  onClick={(e) => handleDeleteFolder(e, folder.id, folder.name)}
                >
                  <IoTrash size={16} />
                </button>
              </div>
            </div>


            
            {/* Inspeções dentro da pasta (só mostra se estiver aberta) */}
            {isOpen && (
              <div className="inspections-list">
                {inspectionsInFolder.length === 0 ? (
                  <p className="empty-folder">Nenhum registro nesta pasta.</p>
                ) : (
                  inspectionsInFolder.map(insp => (
                    <div className="inspection-card" key={insp.id}>
                      <div className="card-header">
                        <strong>{insp.name}</strong>
                        <span className="card-badge">#{insp.id}</span>
                      </div>
                      <div className="card-details">
                        <span className="detail-item">
                          <IoCalendarClearOutline /> {new Date(insp.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="detail-item">
                          <IoResize /> {insp.dimensions_value} {insp.dimensions_unit}
                        </span>
                        <span className="detail-item">
                          <IoImageOutline /> 2 fotos
                        </span>
                      </div>
                      <div className="card-actions">
                        
                        {/* NOVO BOTÃO: Baixar Dados (CSV) - Feature 2 */}
                        <button 
                          className="button-icon-pdf" 
                          onClick={() => handleDownloadCsv(insp.id, insp.name)} 
                          title="Baixar Dados (CSV)"
                        >
                          <IoDocumentTextOutline size={16} />
                        </button>
                        
                        {/* NOVO BOTÃO: Baixar Fotos (ZIP/PNG) - Feature 1 */}
                        <button 
                          className="button-icon-pdf" 
                          onClick={() => handleDownloadPhotos(insp.id, insp.name)} 
                          title="Baixar Fotos (ZIP/PNG)"
                        >
                          <IoImageOutline size={16} />
                        </button>
                        
                        {/* Botão PDF Original */}
                        <button 
                          className="button-icon-pdf" 
                          onClick={() => handleDownloadPdf(insp.id, insp.name)} 
                          title="Baixar Relatório PDF"
                        >
                          <IoDocumentTextOutline size={16} />
                        </button>
                        
                        <button className="button-icon-edit" title="Editar">
                          <IoPencil size={16} />
                        </button>
                        <button className="button-icon-delete" onClick={() => handleDeleteRecord(insp.id)} title="Excluir">
                          <IoTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Dashboard;