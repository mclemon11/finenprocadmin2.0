import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

export default function useAdminAuth() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userState, setUserState] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      // If no authenticated user, mark as not admin and finish loading
      if (!currentUser) {
        setUserState(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const uid = currentUser.uid;
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        const role = userDoc?.data()?.role;
        const status = userDoc?.data()?.status;

        // Debug (mandatory)
        console.log('ADMIN AUTH CHECK', {
          uid,
          userExists: userDoc.exists(),
          role: role,
          status: status,
        });

        // Permitir acceso solo a admin
        const authorized = Boolean(
          userDoc.exists() && role === 'admin' && status === 'active'
        );

        setIsAdmin(authorized);
        setUserState({ uid, email: currentUser.email, role, status });
        setLoading(false);
      } catch (err) {
        console.error('useAdminAuth error', err);
        setIsAdmin(false);
        setUserState(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { loading, isAdmin, user: userState };
}
