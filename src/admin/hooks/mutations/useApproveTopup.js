import { useState } from 'react';
import { doc, updateDoc, collection, addDoc, increment } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';

export default function useApproveTopup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approve = async (topupId, userId, amount, adminUid, adminEmail) => {
    try {
      setLoading(true);
      setError(null);

      // Actualizar estado del topup
      const topupRef = doc(db, 'topups', topupId);
      await updateDoc(topupRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: adminUid
      });

      // Actualizar wallet del usuario (sumar monto)
      const walletRef = doc(db, 'users', userId, 'wallets', userId);
      await updateDoc(walletRef, {
        balance: increment(amount),
        updatedAt: new Date().toISOString()
      });

      // Crear auditLog
      await addDoc(collection(db, 'auditLogs'), {
        action: 'APPROVE_TOPUP',
        adminUid,
        adminEmail,
        targetUserId: userId,
        targetId: topupId,
        status: 'SUCCESS',
        metadata: {
          amount,
          topupId
        },
        timestamp: new Date().toISOString()
      });

      console.log('✓ Recarga aprobada:', topupId);
      return true;
    } catch (err) {
      console.error('✗ Error al aprobar recarga:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { approve, loading, error };
}
