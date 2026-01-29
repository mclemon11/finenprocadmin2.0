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
  where
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { formatMoney } from '../../../utils/formatMoney';
import { t } from '../../../utils/translationHelper';

export default function useApproveInvestment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approve = async (investmentId, adminUid, adminEmail) => {
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

        if (currentStatus === 'active') {
          return;
        }

        if (currentStatus !== 'pending') {
          throw new Error(`No se puede aprobar una inversión con status: ${currentStatus}`);
        }

        const userId = inv?.userId;
        const amount = Number(inv?.amount);
        const originalTransactionId = inv?.transactionId || existingTransactionId || null;
        const projectIdFromInvestment = inv?.projectId || null;
        if (!userId) {
          throw new Error(t('errors.investmentInvalidUserId'));
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error(t('errors.investmentInvalidAmount'));
        }
        if (!projectIdFromInvestment) {
          throw new Error(t('errors.investmentInvalidProjectId'));
        }

        const projectRef = doc(db, 'projects', projectIdFromInvestment);
        const projectSnap = await tx.get(projectRef);
        if (!projectSnap.exists()) {
          throw new Error(t('errors.projectNotFound'));
        }

        const project = projectSnap.data() || {};
        const targetAmount = Number(project.targetAmount ?? project.target ?? project.goalAmount);
        const currentTotalInvestment = Number(
          project.totalInvestment ?? project.totalInvested ?? project.totalInvestedAmount ?? 0
        );

        if (!Number.isFinite(currentTotalInvestment) || currentTotalInvestment < 0) {
          throw new Error(t('errors.projectInvalidTotalInvestment'));
        }

        const hasTarget = Number.isFinite(targetAmount) && targetAmount > 0;
        if (hasTarget) {
          const remaining = targetAmount - currentTotalInvestment;
          if (remaining <= 0) {
            throw new Error(t('errors.projectGoalReached'));
          }
          if (amount > remaining) {
            throw new Error(`La inversión excede el cupo del proyecto. Disponible: ${formatMoney(remaining)}`);
          }
        }

        const walletRef = doc(db, 'users', userId, 'wallets', userId);
        const walletSnap = await tx.get(walletRef);
        if (!walletSnap.exists()) {
          throw new Error(t('errors.userNoWallet'));
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
        const projectId = originalTx?.projectId || projectIdFromInvestment;
        const investmentIdValue = originalTx?.investmentId || investmentId;
        const description = originalTx?.description || 'Inversión aprobada';
        const reference = originalTx?.reference || investmentId;

        // Create a NEW transaction record for history (do not update the pending one).
        const historyTxRef = doc(collection(db, 'transactions'));

        const wallet = walletSnap.data() || {};
        const balance = Number(wallet.balance || 0);
        if (!Number.isFinite(balance)) {
          throw new Error(t('errors.walletInvalidBalance'));
        }
        if (balance < amount) {
          throw new Error(t('errors.insufficientBalance'));
        }

        tx.update(walletRef, {
          balance: increment(-amount),
          updatedAt: serverTimestamp()
        });

        tx.update(projectRef, {
          // Support both field names seen across the codebase.
          totalInvestment: increment(amount),
          totalInvested: increment(amount),
          updatedAt: serverTimestamp()
        });

        tx.update(investmentRef, {
          status: 'active',
          approvedAt: serverTimestamp(),
          approvedBy: adminUid,
          updatedAt: serverTimestamp()
        });

        tx.set(historyTxRef, {
          userId,
          projectId,
          investmentId: investmentIdValue,
          amount,
          currency,
          type: 'investment',
          status: 'approved',
          description,
          reference,
          createdAt: createdAtValue,
          approvedAt: serverTimestamp(),
          approvedBy: adminUid,
        });

        const auditLogRef = doc(collection(db, 'auditLogs'));
        tx.set(auditLogRef, {
          action: 'APPROVE_INVESTMENT',
          adminUid,
          adminEmail,
          targetUserId: userId,
          targetId: investmentId,
          status: 'SUCCESS',
          metadata: {
            amount,
            investmentId,
            projectId: inv?.projectId || null
          },
          timestamp: serverTimestamp()
        });

        const projectName = project?.name || project?.title || project?.projectName || 'el proyecto';
        const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
        tx.set(notificationRef, {
          userId,
          type: 'transaction',
          title: 'Inversión aprobada',
          message: `Tu inversión de ${formatMoney(amount)} ${currency} en ${projectName} fue aprobada.`,
          investmentId: investmentIdValue,
          projectId,
          amount,
          currency,
          read: false,
          createdAt: serverTimestamp(),
        });
      });

      return true;
    } catch (err) {
      console.error('✗ Error al aprobar inversión:', err);
      setError(err?.message || String(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { approve, loading, error };
}
