import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './layout.css';

export default function AdminLayout({ children, admin }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="admin-root">
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-main">
        <AdminHeader admin={admin} onToggleSidebar={toggleSidebar} />
        <main className="admin-content">{children}</main>
      </div>
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`}
        onClick={closeSidebar}
        aria-hidden={!isSidebarOpen}
      />
    </div>
  );
}
