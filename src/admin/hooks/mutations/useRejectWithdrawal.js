import { useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';

export default function useRejectWithdrawal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reject = async (withdrawalId, userId, reason, adminUid, adminEmail) => {
    try {
      setLoading(true);
      setError(null);

      let existingTransactionId = null;
      try {
        const byWithdrawalId = query(
          collection(db, 'transactions'),
          where('withdrawalId', '==', withdrawalId),
          limit(1)
        );
        const txSnap = await getDocs(byWithdrawalId);
        existingTransactionId = txSnap.docs?.[0]?.id || null;

        if (!existingTransactionId) {
          const byReference = query(
            collection(db, 'transactions'),
            where('reference', '==', withdrawalId),
            limit(1)
          );
          const txSnap2 = await getDocs(byReference);
          existingTransactionId = txSnap2.docs?.[0]?.id || null;
        }
      } catch (e) {
        // ignore
      }

      await runTransaction(db, async (tx) => {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        const withdrawalSnap = await tx.get(withdrawalRef);

        if (!withdrawalSnap.exists()) {
          throw new Error('Retiro no encontrado');
        }

        const withdrawalData = withdrawalSnap.data();
        const currentStatus = withdrawalData?.status;

        if (currentStatus === 'rejected') {
          return;
        }

        if (currentStatus !== 'pending') {
          throw new Error(`No se puede rechazar un retiro con status: ${currentStatus}`);
        }

        const resolvedUserId = withdrawalData?.userId || userId;
        const resolvedAmount = Number(withdrawalData?.amount);
        const transactionDocId = withdrawalData?.transactionId || existingTransactionId || withdrawalId;

        if (!resolvedUserId) {
          throw new Error('Retiro inválido: falta userId');
        }

        tx.update(withdrawalRef, {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          rejectedBy: adminUid,
          rejectionReason: reason,
          updatedAt: serverTimestamp(),
        });

        // Create/update transaction record for user history
        const txRef = doc(db, 'transactions', transactionDocId);
        const existingTxSnap = await tx.get(txRef);
        const createdAtValue = withdrawalData?.createdAt && typeof withdrawalData.createdAt !== 'string'
          ? withdrawalData.createdAt
          : serverTimestamp();

        const txPayload = {
          userId: resolvedUserId,
          type: 'withdrawal',
          amount: Number.isFinite(resolvedAmount) ? resolvedAmount : null,
          status: 'rejected',
          sourceType: 'withdrawal',
          sourceId: withdrawalId,
          withdrawalId,
          rejectionReason: reason,
          updatedAt: serverTimestamp(),
        };

        if (existingTxSnap.exists()) {
          tx.update(txRef, txPayload);
        } else {
          tx.set(txRef, {
            ...txPayload,
            createdAt: createdAtValue,
          });
        }

        const auditLogRef = doc(collection(db, 'auditLogs'));
        tx.set(auditLogRef, {
          action: 'REJECT_WITHDRAWAL',
          adminUid,
          adminEmail,
          targetUserId: resolvedUserId,
          targetId: withdrawalId,
          status: 'SUCCESS',
          reason,
          timestamp: serverTimestamp()
        });
      });

      console.log('✓ Retiro rechazado:', withdrawalId);
      return true;
    } catch (err) {
      console.error('✗ Error al rechazar retiro:', err);
      setError(err?.message || String(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { reject, loading, error };
}
