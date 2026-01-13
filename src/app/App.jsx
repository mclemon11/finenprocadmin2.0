import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AdminRouter from './AdminRouter';
import '../styles/theme.css';

export default function App(){
  return (
    <BrowserRouter>
      <AdminRouter />
    </BrowserRouter>
  );
}
