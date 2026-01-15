import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import './AdminLogin.css';

export default function AdminLogin(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateUserDocument = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error('Perfil de usuario no encontrado en Firestore');
    }
    
    const { role, status } = userDoc.data();
    
    if (role !== 'admin') {
      await signOut(auth);
      throw new Error('No tienes permisos de administrador');
    }
    
    if (status !== 'active') {
      await signOut(auth);
      throw new Error('Tu cuenta no está activa');
    }
    
    // Redirigir al dashboard después del login exitoso
    navigate('/admin', { replace: true });
    console.log('✓ Login exitoso:', { uid: user.uid, role, status });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await validateUserDocument(userCredential.user);
    } catch (err) {
      setError(err.message);
      console.error('Error en login:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await validateUserDocument(userCredential.user);
    } catch (err) {
      setError(err.message);
      console.error('Error en login Google:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="auth-title">Iniciar Sesión (Admin)</h1>
        <p className="auth-subtitle">Accede con tus credenciales de administrador</p>
        <form onSubmit={handleLogin} className="auth-form">
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </label>
          <label>
            <span>Contraseña</span>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Accediendo…' : 'Iniciar Sesión'}</button>
        </form>
        <div className="auth-divider">o</div>
        <button className="btn btn-secondary" onClick={handleGoogle} disabled={loading}>Continuar con Google</button>
        <div className="auth-links">
          <Link to="/register">¿No tienes cuenta? Regístrate</Link>
        </div>
      </div>
    </div>
  );
}
