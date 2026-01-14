import React from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import './AdminHeader.css';

export default function AdminHeader({ admin }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1>
          <span className="header-title-main">FINENPROC</span>
          <span className="header-title-badge">ADMIN</span>
        </h1>
      </div>
      <div className="header-right">
        {admin?.email && (
          <div className="admin-email">{admin.email}</div>
        )}
        <button className="btn-ghost" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
