import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './layout.css';

export default function AdminLayout({ children, admin }) {
  return (
    <div className="admin-root">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader admin={admin} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
