import React from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';

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
          <span style={{opacity: 0.6}}>FINENPROC</span>
          <span style={{
            padding: '4px 8px',
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600'
          }}>ADMIN</span>
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
