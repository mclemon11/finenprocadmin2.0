import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAdminAuth from '../auth/useAdminAuth';
import AdminLayout from '../layout/AdminLayout';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import AdminTopups from '../pages/topups/AdminTopups';
import AdminNotAuthorized from '../pages/AdminNotAuthorized';
import AdminLogin from '../pages/auth/AdminLogin';
import AdminRegister from '../pages/auth/AdminRegister';

export default function AdminRouter() {
  const { loading, isAdmin, user } = useAdminAuth();

  if (loading) return <div style={{ padding: 24 }}>Verificando permisos…</div>;

  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/register" element={<AdminRegister />} />
      <Route
        path="/admin"
        element={
          isAdmin ? (
            <AdminLayout admin={user}><AdminDashboard /></AdminLayout>
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
