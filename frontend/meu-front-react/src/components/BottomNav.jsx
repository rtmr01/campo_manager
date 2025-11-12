// src/components/BottomNav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { IoAddCircle, IoDocuments } from 'react-icons/io5';
import './BottomNav.css';

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink 
        to="/add" 
        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
      >
        <IoAddCircle size={24} />
        <span>Adicionar</span>
      </NavLink>
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
      >
        <IoDocuments size={24} />
        <span>Arquivos</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;