import { useState } from 'react';
import {
  getDocs,
  limit,
  doc,
  collection,
  increment,
  query,
  runTransaction,
  where,
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

      // Best-effort: find the existing user-created pending transaction for this topup.
      // This avoids creating duplicates when user app creates /transactions with a random ID.
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
        // ignore lookup errors and fallback to deterministic id
      }

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
        const originalTransactionId = topupData?.transactionId || existingTransactionId || null;
        if (!userId) {
          throw new Error('Topup inválido: falta userId');
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error('Topup inválido: amount debe ser > 0');
        }

        const walletRef = doc(db, 'users', userId, 'wallets', userId);
        const walletSnap = await tx.get(walletRef);

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
          ? `Recarga aprobada (${topupData.methodName})`
          : 'Recarga aprobada');
        const reference = originalTx?.reference || topupId;
        const topupIdValue = originalTx?.topupId || topupId;

        // Create a NEW transaction record for history (do not update the pending one).
        const historyTxRef = doc(collection(db, 'transactions'));

        // Read the related transaction doc before any writes (Firestore requirement).
        // Prefer using a stable ID so the status can be updated without duplicates.
        // All reads are done above; now perform writes.

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

        tx.set(historyTxRef, {
          userId,
          amount,
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
          status: 'approved',
          description,
          reference,
          topupId: topupIdValue,
          createdAt: createdAtValue,
          approvedAt: serverTimestamp(),
          approvedBy: adminUid,
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
