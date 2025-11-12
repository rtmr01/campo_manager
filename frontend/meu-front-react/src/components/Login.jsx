import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  
  const handleStart = () => {
    navigate('/'); 
  };

  return (
    // Usamos o mesmo className do seu HTML original para aproveitar o CSS
    <div className="login-container">
      
      {/* Estes são os mesmos títulos do seu login.html */}
      <h2>Campo Manager</h2>
      <p>Sistema de Gestão de Campo</p>

      {/* Aqui está a mudança: removemos o <form> e colocamos
        um único botão com um evento 'onClick'.
      */}
      <button onClick={handleStart}>Entrar</button>

    </div>
  );
}

export default Login;