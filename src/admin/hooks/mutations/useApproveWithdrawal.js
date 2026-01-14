import { useState } from 'react';
import { doc, updateDoc, collection, addDoc, increment } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';

export default function useApproveWithdrawal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approve = async (withdrawalId, userId, amount, adminUid, adminEmail) => {
    try {
      setLoading(true);
      setError(null);

      // Actualizar estado del retiro
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      await updateDoc(withdrawalRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: adminUid
      });

      // Actualizar wallet del usuario (restar monto)
      const walletRef = doc(db, 'users', userId, 'wallets', userId);
      await updateDoc(walletRef, {
        balance: increment(-amount),
        updatedAt: new Date().toISOString()
      });

      // Crear auditLog
      await addDoc(collection(db, 'auditLogs'), {
        action: 'APPROVE_WITHDRAWAL',
        adminUid,
        adminEmail,
        targetUserId: userId,
        targetId: withdrawalId,
        status: 'SUCCESS',
        metadata: {
          amount,
          withdrawalId
        },
        timestamp: new Date().toISOString()
      });

      console.log('✓ Retiro aprobado:', withdrawalId);
      return true;
    } catch (err) {
      console.error('✗ Error al aprobar retiro:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { approve, loading, error };
}
