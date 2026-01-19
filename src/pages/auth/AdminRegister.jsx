import React, { useState } from 'react';
import { createUserWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, getProvisioningAuth } from '../../firebase/firebaseConfig';
import useAdminAuth from '../../auth/useAdminAuth';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import './AdminRegister.css';

export default function AdminRegister(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { loading: authLoading, isAdmin } = useAdminAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (authLoading) return;

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Security model (matches your Firestore rules): only an existing admin can create admin users.
    if (!isAdmin) {
      setError('Solo un administrador puede crear cuentas de administrador. Inicia sesión como admin y vuelve a intentar.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    
    let userCredential = null;
    const provisioningAuth = getProvisioningAuth();
    
    try {
      // Paso 1: Crear usuario en Firebase Auth usando una instancia secundaria
      // (no cambia la sesión del admin actual)
      userCredential = await createUserWithEmailAndPassword(provisioningAuth, email.trim(), password);
      const user = userCredential.user;
      
      console.log('✓ Usuario creado en Auth:', user.uid);
      
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
        // Cerrar la sesión de la instancia secundaria para no dejar una sesión abierta en memoria
        await signOut(provisioningAuth);

        // Redirigir al dashboard después del registro exitoso
        setTimeout(() => navigate('/admin', { replace: true }), 1500);
        
      } catch (firestoreError) {
        // Si Firestore falla, eliminar el usuario de Auth (rollback)
        console.error('✗ Error al crear documento Firestore:', firestoreError);
        try {
          await deleteUser(user);
        } catch (deleteErr) {
          console.error('✗ Error al eliminar usuario recién creado:', deleteErr);
        }
        await signOut(provisioningAuth);
        throw new Error('Error al crear perfil en Firestore. Revisa permisos/reglas.');
      }
      
    } catch (err) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error desconocido en el registro');

      // Best-effort cleanup: ensure the secondary auth isn't left signed in
      await signOut(provisioningAuth).catch(e => console.error('Error en signOut provisioning:', e));
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
            <h1 className="auth-title">Crear Cuenta Admin</h1>
            <p className="auth-subtitle">Registra un nuevo administrador</p>
          </div>

          {success && (
            <div className="auth-success">
              <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              ¡Usuario admin registrado exitosamente! Serás redirigido...
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <span>Email</span>
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
                <span>Contraseña</span>
              </label>
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={(e)=>setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
              <span className="password-hint">Mínimo 6 caracteres</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <span>Confirmar Contraseña</span>
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
              disabled={loading || authLoading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Registrando…
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          <div className="auth-links">
            <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
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
