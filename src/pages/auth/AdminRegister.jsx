import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import logo from '../../assets/Logo.png';
import './AdminRegister.css';

export default function AdminRegister(){
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    // Para revertir al modelo “solo admins pueden crear admins”, descomenta esto:
    // if (!isAdmin) { setError('Solo un administrador puede crear cuentas de administrador.'); return; }

    setLoading(true);
    setError(null);
    setSuccess(false);
    
    let userCredential = null;
    let createdNewAuthUser = false;
    
    try {
      // Paso 1: Crear usuario en Firebase Auth usando una instancia secundaria
      // Para testing: usamos la sesión principal para que el usuario quede autenticado
      // y pueda escribir su propio perfil en Firestore.
      // Si el email ya existe, en vez de fallar intentamos autenticarlo con la misma contraseña.
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        createdNewAuthUser = true;
      } catch (authErr) {
        const code = authErr?.code;
        if (code === 'auth/email-already-in-use') {
          userCredential = await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );
          createdNewAuthUser = false;
        } else {
          throw authErr;
        }
      }

      const user = userCredential.user;

      console.log(
        createdNewAuthUser
          ? '✓ Usuario creado en Auth:'
          : '✓ Usuario ya existía en Auth (sign-in OK):',
        user.uid
      );
      
      // Paso 2: Crear documento en Firestore como el admin actual (permitido por reglas)
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        console.log('✓ Documento Firestore creado exitosamente');
        setSuccess(true);

        // Redirigir al dashboard después del registro exitoso
        setTimeout(() => navigate('/admin', { replace: true }), 1500);
        
      } catch (firestoreError) {
        // Si Firestore falla, eliminar el usuario de Auth (rollback)
        console.error('✗ Error al crear documento Firestore:', firestoreError);
        try {
          if (createdNewAuthUser) {
            await deleteUser(user);
          }
        } catch (deleteErr) {
          console.error('✗ Error al eliminar usuario recién creado:', deleteErr);
        }
        throw new Error('Error al crear perfil en Firestore. Revisa permisos/reglas.');
      }
      
    } catch (err) {
      console.error('Error en registro:', err);

      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setError(t('auth.emailExistsWrongPassword'));
      } else if (err?.code === 'auth/user-not-found') {
        setError(t('auth.userNotFound'));
      } else {
        setError(err.message || t('common.error'));
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img src={logo} alt="Logo" className="auth-logo" />
            <h1 className="auth-title">{t('auth.createAdminAccount')}</h1>
            <p className="auth-subtitle">{t('auth.registerNewAdmin')}</p>
          </div>

          {success && (
            <div className="auth-success">
              <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t('auth.adminRegisteredSuccess')}
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <span>{t('auth.email')}</span>
              </label>
              <input 
                id="email"
                type="email" 
                value={email} 
                onChange={(e)=>setEmail(e.target.value)} 
                placeholder="admin@tuempresa.com"
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <span>{t('auth.password')}</span>
              </label>
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={(e)=>setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
              <span className="password-hint">{t('auth.passwordHint')}</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <span>{t('auth.confirmPassword')}</span>
              </label>
              <input 
                id="confirmPassword"
                type="password" 
                value={confirmPassword} 
                onChange={(e)=>setConfirmPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>

            {error && <div className="auth-error">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>}

            <button 
              className="btn btn-primary btn-large" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {t('auth.registering')}
                </>
              ) : (
                t('auth.createAccount')
              )}
            </button>
          </form>

          <div className="auth-links">
            <p>{t('auth.hasAccount')} <Link to="/login">{t('auth.loginHere')}</Link></p>
          </div>
        </div>

        <div className="auth-background">
          <div className="gradient-blob"></div>
          <div className="gradient-blob"></div>
        </div>
      </div>
    </div>
  );
}
