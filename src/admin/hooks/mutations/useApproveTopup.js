import { useState } from 'react';
import {
  doc,
  collection,
  increment,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';

export default function useApproveTopup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approve = async (topupId, adminUid, adminEmail) => {
    try {
      setLoading(true);
      setError(null);

      await runTransaction(db, async (tx) => {
        const topupRef = doc(db, 'topups', topupId);
        const topupSnap = await tx.get(topupRef);

        if (!topupSnap.exists()) {
          throw new Error('Topup no encontrado');
        }

        const topupData = topupSnap.data();
        const currentStatus = topupData?.status;

        if (currentStatus === 'approved') {
          return;
        }

        if (currentStatus !== 'pending') {
          throw new Error(`No se puede aprobar un topup con status: ${currentStatus}`);
        }

        const userId = topupData?.userId;
        const amount = Number(topupData?.amount);
        if (!userId) {
          throw new Error('Topup inválido: falta userId');
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error('Topup inválido: amount debe ser > 0');
        }

        const walletRef = doc(db, 'users', userId, 'wallets', userId);
        const walletSnap = await tx.get(walletRef);

        if (walletSnap.exists()) {
          tx.update(walletRef, {
            balance: increment(amount),
            updatedAt: serverTimestamp()
          });
        } else {
          tx.set(walletRef, {
            uid: userId,
            balance: amount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        tx.update(topupRef, {
          status: 'approved',
          approvedAt: serverTimestamp(),
          approvedBy: adminUid
        });

        const auditLogRef = doc(collection(db, 'auditLogs'));
        tx.set(auditLogRef, {
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
          timestamp: serverTimestamp()
        });
      });

      console.log('✓ Recarga aprobada:', topupId);
      return true;
    } catch (err) {
      console.error('✗ Error al aprobar recarga:', err);
      setError(err?.message || String(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { approve, loading, error };
}
