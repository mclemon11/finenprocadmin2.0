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
import { t } from '../../../utils/translationHelper';

export default function useRejectInvestment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reject = async (investmentId, reason, adminUid, adminEmail) => {
    try {
      setLoading(true);
      setError(null);

      let existingTransactionId = null;
      try {
        const txQ = query(
          collection(db, 'transactions'),
          where('investmentId', '==', investmentId),
          limit(1)
        );
        const txSnap = await getDocs(txQ);
        existingTransactionId = txSnap.docs?.[0]?.id || null;
      } catch (e) {
        // ignore
      }

      await runTransaction(db, async (tx) => {
        const investmentRef = doc(db, 'investments', investmentId);
        const invSnap = await tx.get(investmentRef);

        if (!invSnap.exists()) {
          throw new Error(t('errors.investmentNotFound'));
        }

        const inv = invSnap.data();
        const currentStatus = inv?.status;

        if (currentStatus === 'cancelled') {
          return;
        }

        if (currentStatus !== 'pending') {
          throw new Error(`No se puede rechazar una inversión con status: ${currentStatus}`);
        }

        const userId = inv?.userId;
        const amount = Number(inv?.amount);
        const originalTransactionId = inv?.transactionId || existingTransactionId || null;

        if (!userId) {
          throw new Error(t('errors.investmentInvalidUserId'));
        }

        const originalTxRef = originalTransactionId
          ? doc(db, 'transactions', originalTransactionId)
          : null;
        const originalTxSnap = originalTxRef ? await tx.get(originalTxRef) : null;

        const originalTx = originalTxSnap?.exists() ? originalTxSnap.data() : null;
        const createdAtValue = originalTx?.createdAt && typeof originalTx.createdAt !== 'string'
          ? originalTx.createdAt
          : inv?.createdAt && typeof inv.createdAt !== 'string'
            ? inv.createdAt
            : serverTimestamp();
        const currency = originalTx?.currency || inv?.currency || 'USD';
        const projectId = originalTx?.projectId || inv?.projectId || null;
        const investmentIdValue = originalTx?.investmentId || investmentId;
        const description = originalTx?.description || 'Inversión rechazada';
        const reference = originalTx?.reference || investmentId;

        // Create a NEW transaction record for history (do not update the pending one).
        const historyTxRef = doc(collection(db, 'transactions'));

        // All reads are done above; now perform writes.

        tx.update(investmentRef, {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
          cancelledBy: adminUid,
          cancellationReason: reason,
          updatedAt: serverTimestamp(),
        });

        tx.set(historyTxRef, {
          userId,
          projectId,
          investmentId: investmentIdValue,
          amount: Number.isFinite(amount) ? amount : null,
          currency,
          type: 'investment',
          status: 'rejected',
          description,
          reference,
          createdAt: createdAtValue,
          rejectionReason: reason,
          rejectedAt: serverTimestamp(),
          rejectedBy: adminUid,
        });

        const auditLogRef = doc(collection(db, 'auditLogs'));
        tx.set(auditLogRef, {
          action: 'REJECT_INVESTMENT',
          adminUid,
          adminEmail,
          targetUserId: userId,
          targetId: investmentId,
          status: 'SUCCESS',
          reason,
          timestamp: serverTimestamp(),
        });
      });

      return true;
    } catch (err) {
      console.error('✗ Error al rechazar inversión:', err);
      setError(err?.message || String(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { reject, loading, error };
}
