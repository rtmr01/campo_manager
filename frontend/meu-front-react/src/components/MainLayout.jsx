// src/components/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header />
      {/* 'Outlet' é onde o React Router vai renderizar a página (Dashboard ou AddRecord) */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default MainLayout;