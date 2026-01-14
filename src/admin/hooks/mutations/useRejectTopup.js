import { useState } from 'react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';

export default function useRejectTopup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reject = async (topupId, userId, reason, adminUid, adminEmail) => {
    try {
      setLoading(true);
      setError(null);

      // Actualizar estado del topup
      const topupRef = doc(db, 'topups', topupId);
      await updateDoc(topupRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminUid,
        rejectionReason: reason
      });

      // Crear auditLog
      await addDoc(collection(db, 'auditLogs'), {
        action: 'REJECT_TOPUP',
        adminUid,
        adminEmail,
        targetUserId: userId,
        targetId: topupId,
        status: 'SUCCESS',
        reason,
        timestamp: new Date().toISOString()
      });

      console.log('✓ Recarga rechazada:', topupId);
      return true;
    } catch (err) {
      console.error('✗ Error al rechazar recarga:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { reject, loading, error };
}
