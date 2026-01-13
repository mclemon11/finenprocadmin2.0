import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminNotAuthorized(){
  return (
    <div style={{padding:24}}>
      <h2>Not Authorized</h2>
      <p>You don't have permission to view the admin area.</p>
      <p><Link to="/login">Go to Login</Link> or <Link to="/register">Register</Link></p>
    </div>
  );
}
