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

export default function useRejectTopup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reject = async (topupId, userId, reason, adminUid, adminEmail) => {
    try {
      setLoading(true);
      setError(null);

      let existingTransactionId = null;
      try {
        const txQ = query(
          collection(db, 'transactions'),
          where('topupId', '==', topupId),
          limit(1)
        );
        const txSnap = await getDocs(txQ);
        existingTransactionId = txSnap.docs?.[0]?.id || null;
      } catch (e) {
        // ignore
      }

      await runTransaction(db, async (tx) => {
        const topupRef = doc(db, 'topups', topupId);
        const topupSnap = await tx.get(topupRef);

        if (!topupSnap.exists()) {
          throw new Error('Topup no encontrado');
        }

        const topupData = topupSnap.data();
        const currentStatus = topupData?.status;

        if (currentStatus === 'rejected') {
          return;
        }
        if (currentStatus !== 'pending') {
          throw new Error(`No se puede rechazar un topup con status: ${currentStatus}`);
        }

        const resolvedUserId = topupData?.userId || userId;
        const amount = Number(topupData?.amount);
        const originalTransactionId = topupData?.transactionId || existingTransactionId || null;
        if (!resolvedUserId) {
          throw new Error('Topup inválido: falta userId');
        }

        const originalTxRef = originalTransactionId
          ? doc(db, 'transactions', originalTransactionId)
          : null;
        const originalTxSnap = originalTxRef ? await tx.get(originalTxRef) : null;

        const originalTx = originalTxSnap?.exists() ? originalTxSnap.data() : null;
        const createdAtValue = originalTx?.createdAt && typeof originalTx.createdAt !== 'string'
          ? originalTx.createdAt
          : topupData?.createdAt && typeof topupData.createdAt !== 'string'
            ? topupData.createdAt
            : serverTimestamp();
        const currency = originalTx?.currency || topupData?.currency || 'USD';
        const methodId = originalTx?.methodId || topupData?.methodId || null;
        const methodName = originalTx?.methodName || topupData?.methodName || topupData?.method || null;
        const methodType = originalTx?.methodType || topupData?.methodType || null;
        const methodDetailsText = originalTx?.methodDetailsText || topupData?.methodDetailsText || null;
        const proofUrl = originalTx?.proofUrl || topupData?.proofUrl || null;
        const proofPath = originalTx?.proofPath || topupData?.proofPath || null;
        const proofFileName = originalTx?.proofFileName || topupData?.proofFileName || null;
        const proofContentType = originalTx?.proofContentType || topupData?.proofContentType || null;
        const proofSize = typeof (originalTx?.proofSize ?? topupData?.proofSize) === 'number'
          ? (originalTx?.proofSize ?? topupData?.proofSize)
          : null;
        const description = originalTx?.description || (topupData?.methodName
          ? `Recarga rechazada (${topupData.methodName})`
          : 'Recarga rechazada');
        const reference = originalTx?.reference || topupId;
        const topupIdValue = originalTx?.topupId || topupId;

        // Create a NEW transaction record for history (do not update the pending one).
        const historyTxRef = doc(collection(db, 'transactions'));

        // All reads are done above; now perform writes.
        tx.update(topupRef, {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          rejectedBy: adminUid,
          rejectionReason: reason
        });

        tx.set(historyTxRef, {
          userId: resolvedUserId,
          amount: Number.isFinite(amount) ? amount : null,
          currency,
          methodId,
          methodName,
          methodType,
          methodDetailsText,
          proofUrl,
          proofPath,
          proofFileName,
          proofContentType,
          proofSize,
          type: 'deposit',
          status: 'rejected',
          description,
          reference,
          topupId: topupIdValue,
          createdAt: createdAtValue,
          rejectionReason: reason,
          rejectedAt: serverTimestamp(),
          rejectedBy: adminUid,
        });

        const auditLogRef = doc(collection(db, 'auditLogs'));
        tx.set(auditLogRef, {
          action: 'REJECT_TOPUP',
          adminUid,
          adminEmail,
          targetUserId: resolvedUserId,
          targetId: topupId,
          status: 'SUCCESS',
          reason,
          timestamp: serverTimestamp()
        });
      });

      console.log('✓ Recarga rechazada:', topupId);
      return true;
    } catch (err) {
      console.error('✗ Error al rechazar recarga:', err);
      setError(err?.message || String(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { reject, loading, error };
}
