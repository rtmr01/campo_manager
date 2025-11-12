// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importa as páginas
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AddRecord from './components/AddRecord';

// Importa o "molde"
import MainLayout from './components/MainLayout';

function App() {
  return (
    <Routes>
      {/* Rota de Login (sem cabeçalho/nav) */}
      <Route path="/login" element={<Login />} />

      {/* Rotas "Privadas" que usam o MainLayout */}
      <Route path="/" element={<MainLayout />}>
        {/* 'index' significa que esta é a rota padrão para "/" */}
        <Route index element={<Dashboard />} /> 
        <Route path="add" element={<AddRecord />} />
      </Route>
      
      {/* Adicione um redirecionamento caso o usuário caia no /login
          (já que usamos ele como "splash" na conversa anterior)
          Vamos mudar para a rota raiz ser o login
      */}
      
      {/* VERSÃO CORRIGIDA: Login é a entrada */}
      {/* <Route path="/login" element={<Login />} />
      <Route path="/app" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="add" element={<AddRecord />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} /> */}
      
      {/* Vamos manter o que combinamos: /login é a entrada. 
        O usuário clica em "Entrar" e vai para "/" (Dashboard).
        Seu App.jsx está ótimo como na conversa anterior:
      */}
      
      {/* SEU App.jsx DEVE FICAR ASSIM: */}
      {/* <Route path="/login" element={<Login />} />
           <Route path="/" element={<Dashboard />} />
           <Route path="/add" element={<AddRecord />} /> 
           ...
           NÃO. Para ter o layout, precisamos do "MainLayout"
      */}
      
      {/* VAMOS FAZER O CORRETO E FINAL: */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="add" element={<AddRecord />} />
      </Route>
    </Routes>
  );
}

export default App;