import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAdminAuth from '../auth/useAdminAuth';
import AdminLayout from '../layout/AdminLayout';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import AdminTopups from '../pages/topups/AdminTopups';
import AdminNotAuthorized from '../pages/AdminNotAuthorized';
import AdminLogin from '../pages/auth/AdminLogin';
import AdminRegister from '../pages/auth/AdminRegister';
import AdminDashboardPage from '../admin/pages/AdminDashboardPage';
import UsuariosPage from '../admin/pages/UsuariosPage';
import RecargasPage from '../admin/pages/RecargasPage';
import RetirosPage from '../admin/pages/RetirosPage';
import InversionesPage from '../admin/pages/InversionesPage';
import ProyectosPage from '../admin/pages/ProyectosPage';
import './AdminRouter.css';

export default function AdminRouter() {
  const { loading, isAdmin, user } = useAdminAuth();

  if (loading) {
    return (
      <div className="admin-router-loading">
        <div className="admin-router-loading-message">Verificando permisos…</div>
        <div className="admin-router-loading-submessage">Validando credenciales en Firestore</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/register" element={<AdminRegister />} />
      <Route
        path="/admin"
        element={
          isAdmin ? (
            <AdminLayout admin={user}><AdminDashboardPage /></AdminLayout>
          ) : (
            <Navigate to="/admin/not-authorized" replace />
          )
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          isAdmin ? (
            <AdminLayout admin={user}><UsuariosPage adminData={user} /></AdminLayout>
          ) : (
            <Navigate to="/admin/not-authorized" replace />
          )
        }
      />
      <Route
        path="/admin/operaciones/recargas"
        element={
          isAdmin ? (
            <AdminLayout admin={user}><RecargasPage adminData={user} /></AdminLayout>
          ) : (
            <Navigate to="/admin/not-authorized" replace />
          )
        }
      />
      <Route
        path="/admin/operaciones/retiros"
        element={
          isAdmin ? (
            <AdminLayout admin={user}><RetirosPage adminData={user} /></AdminLayout>
          ) : (
            <Navigate to="/admin/not-authorized" replace />
          )
        }
      />
      <Route
        path="/admin/operaciones/inversiones"
        element={
          isAdmin ? (
            <AdminLayout admin={user}><InversionesPage adminData={user} /></AdminLayout>
          ) : (
            <Navigate to="/admin/not-authorized" replace />
          )
        }
      />
      <Route
        path="/admin/proyectos"
        element={
          isAdmin ? (
            <AdminLayout admin={user}><ProyectosPage adminData={user} /></AdminLayout>
          ) : (
            <Navigate to="/admin/not-authorized" replace />
          )
        }
      />
      <Route
        path="/admin/topups"
        element={
          isAdmin ? (
            <AdminLayout admin={user}><AdminTopups /></AdminLayout>
          ) : (
            <Navigate to="/admin/not-authorized" replace />
          )
        }
      />
      <Route path="/admin/not-authorized" element={<AdminNotAuthorized />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
