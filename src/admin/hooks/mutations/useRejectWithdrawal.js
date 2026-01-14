import { useState } from 'react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';

export default function useRejectWithdrawal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reject = async (withdrawalId, userId, reason, adminUid, adminEmail) => {
    try {
      setLoading(true);
      setError(null);

      // Actualizar estado del retiro
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      await updateDoc(withdrawalRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminUid,
        rejectionReason: reason
      });

      // Crear auditLog
      await addDoc(collection(db, 'auditLogs'), {
        action: 'REJECT_WITHDRAWAL',
        adminUid,
        adminEmail,
        targetUserId: userId,
        targetId: withdrawalId,
        status: 'SUCCESS',
        reason,
        timestamp: new Date().toISOString()
      });

      console.log('✓ Retiro rechazado:', withdrawalId);
      return true;
    } catch (err) {
      console.error('✗ Error al rechazar retiro:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { reject, loading, error };
}
