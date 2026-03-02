import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, runTransaction, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useDistribution() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch active/funded projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'projects'));
      const projs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => ['active', 'funded', 'open'].includes(p.status));
      setProjects(projs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch investors for a project
  const fetchProjectInvestors = async (projectId) => {
    try {
      setLoading(true);
      const invQ = query(
        collection(db, 'investments'),
        where('projectId', '==', projectId),
        where('status', 'in', ['active', 'approved'])
      );
      const invSnap = await getDocs(invQ);
      const investments = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const totalInvested = investments.reduce((a, i) => a + (i.amount || 0), 0);

      // Enrich with user data
      const enriched = await Promise.all(
        investments.map(async (inv) => {
          try {
            const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', inv.userId)));
            let userData = {};
            if (userSnap.docs.length > 0) {
              userData = userSnap.docs[0].data();
            } else {
              const { getDoc: getDocFn } = await import('firebase/firestore');
              const uDoc = await getDocFn(doc(db, 'users', inv.userId));
              if (uDoc.exists()) userData = uDoc.data();
            }
            const share = totalInvested > 0 ? (inv.amount / totalInvested) * 100 : 0;
            return {
              ...inv,
              userName: userData.displayName || userData.email || 'Unknown',
              userEmail: userData.email || '',
              share,
            };
          } catch {
            return { ...inv, userName: 'Unknown', userEmail: '', share: 0 };
          }
        })
      );

      setInvestors(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Distribute returns
  const distributeReturns = async (projectId, totalReturn, adminUid, adminEmail, feePercent = 0.5) => {
    try {
      setDistributing(true);
      setError(null);

      const fee = totalReturn * (feePercent / 100);
      const netReturn = totalReturn - fee;
      const totalInvested = investors.reduce((a, i) => a + (i.amount || 0), 0);

      for (const inv of investors) {
        const share = totalInvested > 0 ? inv.amount / totalInvested : 0;
        const payout = netReturn * share;

        await runTransaction(db, async (transaction) => {
          // Credit wallet
          const walletRef = doc(db, 'users', inv.userId, 'wallets', inv.userId);
          const walletSnap = await transaction.get(walletRef);
          if (walletSnap.exists()) {
            const currentBalance = walletSnap.data().balance || 0;
            transaction.update(walletRef, {
              balance: currentBalance + payout,
              updatedAt: new Date().toISOString()
            });
          }

          // Create payout record
          const payoutRef = doc(collection(db, 'payouts'));
          transaction.set(payoutRef, {
            userId: inv.userId,
            projectId,
            investmentId: inv.id,
            amount: payout,
            totalReturn,
            sharePercent: share * 100,
            status: 'completed',
            projectName: selectedProject?.name || '',
            createdAt: new Date().toISOString()
          });

          // Create transaction record
          const txRef = doc(collection(db, 'transactions'));
          transaction.set(txRef, {
            userId: inv.userId,
            type: 'payout',
            amount: payout,
            status: 'completed',
            description: `Return from ${selectedProject?.name || 'project'}`,
            projectId,
            createdAt: new Date().toISOString()
          });
        });
      }

      // Audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'distribute_returns',
        adminUid,
        adminEmail,
        targetId: projectId,
        details: `Distributed $${totalReturn} (fee: $${fee.toFixed(2)}) to ${investors.length} investors`,
        status: 'completed',
        timestamp: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Distribution error:', err);
      setError(err.message);
      return false;
    } finally {
      setDistributing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectInvestors(selectedProject.id);
    }
  }, [selectedProject?.id]);

  return {
    projects,
    selectedProject,
    setSelectedProject,
    investors,
    loading,
    distributing,
    error,
    distributeReturns,
    refetch: fetchProjects
  };
}
