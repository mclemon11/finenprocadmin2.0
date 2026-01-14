import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './AdminRegister.css';

export default function AdminRegister(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    let userCredential = null;
    
    try {
      // Paso 1: Crear usuario en Firebase Auth
      userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      console.log('✓ Usuario creado en Auth:', user.uid);
      
      // Paso 2: Crear documento en Firestore (CRÍTICO)
      try {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Documento Firestore creado exitosamente');
        setSuccess(true);
        // Redirigir al dashboard después del registro exitoso
        setTimeout(() => navigate('/admin', { replace: true }), 1500);
        
      } catch (firestoreError) {
        // Si Firestore falla, eliminar el usuario de Auth (rollback)
        console.error('✗ Error al crear documento Firestore:', firestoreError);
        await signOut(auth);
        throw new Error('Error al crear perfil en Firestore. Usuario eliminado de Auth.');
      }
      
    } catch (err) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error desconocido en el registro');
      
      // Si hay usuario creado pero Firestore falló, cerrar sesión
      if (userCredential) {
        await signOut(auth).catch(e => console.error('Error en signOut:', e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="auth-title">Registrar Cuenta (Admin)</h1>
        <p className="auth-subtitle">Crea una cuenta con rol de administrador</p>
        {success && (
          <div className="auth-success">
            ¡Usuario admin registrado exitosamente! Serás redirigido...
          </div>
        )}
        <form onSubmit={handleRegister} className="auth-form">
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </label>
          <label>
            <span>Contraseña</span>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Registrando…' : 'Registrar'}</button>
        </form>
        <div className="auth-links">
          <a href="/login">¿Ya tienes cuenta? Inicia sesión</a>
        </div>
      </div>
    </div>
  );
}
