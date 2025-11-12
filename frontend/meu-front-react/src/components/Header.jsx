// src/components/Header.jsx
import React from 'react';
import { IoLogOutOutline } from 'react-icons/io5';
import './Header.css';

function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <span>Olá, <strong>PEDRO</strong></span>
        {/* Ícone de "Sair" (como visto na imagem) */}
        <IoLogOutOutline size={26} color="#5a6578" />
      </div>
    </header>
  );
}

export default Header;