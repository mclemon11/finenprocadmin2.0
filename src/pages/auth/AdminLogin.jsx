import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import logo from '../../assets/Logo.png';
import './AdminLogin.css';

export default function AdminLogin(){
  const { t } = useLanguage();
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
      throw new Error(t('auth.profileNotFound'));
    }
    
    const { role, status } = userDoc.data();
    
    if (role !== 'admin') {
      await signOut(auth);
      throw new Error(t('auth.notAuthorizedMessage'));
    }
    
    if (status !== 'active') {
      await signOut(auth);
      throw new Error(t('auth.accountNotActive'));
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
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img src={logo} alt="Logo" className="auth-logo" />
            <h1 className="auth-title">{t('auth.login')}</h1>
            <p className="auth-subtitle">{t('auth.adminPanel')}</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <span>{t('auth.email')}</span>
              </label>
              <input 
                id="email"
                type="email" 
                value={email} 
                onChange={(e)=>setEmail(e.target.value)} 
                placeholder="tu@email.com"
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
                  {t('auth.signingIn')}
                </>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>{t('auth.orContinueWith')}</span>
          </div>

          <button 
            className="btn btn-google" 
            onClick={handleGoogle} 
            disabled={loading}
            type="button"
          >
            <svg viewBox="0 0 24 24" className="google-icon">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('auth.continueWithGoogle')}
          </button>

          <div className="auth-links">
            <p>{t('auth.noAccount')} <Link to="/register">{t('auth.registerHere')}</Link></p>
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
