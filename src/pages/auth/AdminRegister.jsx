import React, { useState } from 'react';
import { createUserWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, getProvisioningAuth } from '../../firebase/firebaseConfig';
import useAdminAuth from '../../auth/useAdminAuth';
import { Link, useNavigate } from 'react-router-dom';
import './AdminRegister.css';

export default function AdminRegister(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { loading: authLoading, isAdmin } = useAdminAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (authLoading) return;

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
          <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
