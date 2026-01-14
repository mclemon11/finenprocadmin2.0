import React from 'react';
import { Link } from 'react-router-dom';
import './AdminNotAuthorized.css';

export default function AdminNotAuthorized(){
  return (
    <div className="admin-not-authorized">
      <h2>No Autorizado</h2>
      <p>No tienes permiso para acceder al área de administración.</p>
      <p><Link to="/login">Ir a Login</Link> o <Link to="/register">Registrarse</Link></p>
    </div>
  );
}
