import { useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { t } from '../../../utils/translationHelper';

export default function useApproveWithdrawal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approve = async (withdrawalId, userId, amount, adminUid, adminEmail) => {
    try {
      setLoading(true);
      setError(null);

      // Best-effort: find the existing user-created pending transaction for this withdrawal.
      // We do it outside the transaction because Firestore transactions cannot run arbitrary queries.
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
          throw new Error(t('errors.withdrawalNotFound'));
        }

        const withdrawalData = withdrawalSnap.data();
        const currentStatus = withdrawalData?.status;

        if (currentStatus === 'approved') {
          return;
        }

        if (currentStatus !== 'pending') {
          throw new Error(`No se puede aprobar un retiro con status: ${currentStatus}`);
        }

        const resolvedUserId = withdrawalData?.userId || userId;
        const resolvedAmount = Number(withdrawalData?.amount ?? amount);
        const transactionDocId = withdrawalData?.transactionId || existingTransactionId || withdrawalId;

        if (!resolvedUserId) {
          throw new Error(t('errors.withdrawalInvalidUserId'));
        }
        if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
          throw new Error(t('errors.withdrawalInvalidAmount'));
        }

        const walletRef = doc(db, 'users', resolvedUserId, 'wallets', resolvedUserId);
        const walletSnap = await tx.get(walletRef);
        if (!walletSnap.exists()) {
          throw new Error(t('errors.userNoWallet'));
        }

        tx.update(walletRef, {
          balance: increment(-resolvedAmount),
          updatedAt: serverTimestamp()
        });

        tx.update(withdrawalRef, {
          status: 'approved',
          approvedAt: serverTimestamp(),
          approvedBy: adminUid,
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
          amount: resolvedAmount,
          status: 'approved',
          sourceType: 'withdrawal',
          sourceId: withdrawalId,
          withdrawalId,
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
          action: 'APPROVE_WITHDRAWAL',
          adminUid,
          adminEmail,
          targetUserId: resolvedUserId,
          targetId: withdrawalId,
          status: 'SUCCESS',
          metadata: {
            amount: resolvedAmount,
            withdrawalId
          },
          timestamp: serverTimestamp()
        });
      });

      console.log('✓ Retiro aprobado:', withdrawalId);
      return true;
    } catch (err) {
      console.error('✗ Error al aprobar retiro:', err);
      setError(err?.message || String(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { approve, loading, error };
}
