import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { t } from '../../utils/translationHelper';

/**
 * Hook que carga el detalle completo de una inversión:
 * - Datos de la inversión
 * - Datos del usuario (inversionista)
 * - Datos del proyecto
 * - Eventos de timeline del proyecto que impactan la inversión
 * - Audit log de cambios en la inversión
 */
export default function useInvestmentDetail(investmentId) {
  const [investment, setInvestment] = useState(null);
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [projectEvents, setProjectEvents] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvestmentDetail = async () => {
    if (!investmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Cargar inversión
      const invRef = doc(db, 'investments', investmentId);
      const invSnap = await getDoc(invRef);

      if (!invSnap.exists()) {
        throw new Error(t('errors.investmentNotFound'));
      }

      const investmentData = { id: invSnap.id, ...invSnap.data() };

      // 2. Cargar usuario (inversionista)
      let userData = null;
      if (investmentData.userId) {
        const userRef = doc(db, 'users', investmentData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          userData = { id: userSnap.id, ...userSnap.data() };
        }
      }

      // 3. Cargar proyecto
      let projectData = null;
      if (investmentData.projectId) {
        const projectRef = doc(db, 'projects', investmentData.projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          projectData = { id: projectSnap.id, ...projectSnap.data() };
        }
      }

      // 4. Cargar eventos del timeline del proyecto que impactan inversiones
      let eventsData = [];
      if (investmentData.projectId) {
        const timelineRef = collection(db, 'projects', investmentData.projectId, 'timeline');
        const eventsQuery = query(
          timelineRef,
          orderBy('createdAt', 'desc')
        );
        const eventsSnap = await getDocs(eventsQuery);
        eventsData = eventsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      // 5. Cargar audit log de cambios en la inversión
      let auditData = [];
      const auditRef = collection(db, 'investments', investmentId, 'auditLog');
      const auditQuery = query(auditRef, orderBy('timestamp', 'desc'));
      const auditSnap = await getDocs(auditQuery);
      auditData = auditSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Enriquecer inversión con cálculos
      const enrichedInvestment = enrichInvestmentData(investmentData, projectData);

      setInvestment(enrichedInvestment);
      setUser(userData);
      setProject(projectData);
      setProjectEvents(eventsData);
      setAuditLog(auditData);
    } catch (err) {
      console.error('Error en useInvestmentDetail:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enrichInvestmentData = (inv, project) => {
    const amount = Number(inv.amount || 0);
    const expectedReturn = Number(inv.expectedReturn || 0);
    const actualReturn = Number(inv.actualReturn || inv.realizedReturn || inv.payout || 0);
    const projectTotal = Number(project?.totalInvested || 0);

    const expectedROI = amount > 0 ? ((expectedReturn - amount) / amount * 100).toFixed(2) : null;
    const actualROI = amount > 0 && actualReturn > 0 ? ((actualReturn - amount) / amount * 100).toFixed(2) : null;

    const projectionOfTotal = projectTotal > 0 ? ((amount / projectTotal) * 100).toFixed(2) : null;

    const expectedGain = expectedReturn - amount;
    const actualGain = actualReturn > 0 ? actualReturn - amount : null;

    return {
      ...inv,
      expectedROI: Number(expectedROI),
      actualROI: actualROI ? Number(actualROI) : null,
      projectionOfTotal: Number(projectionOfTotal),
      expectedGain,
      actualGain,
    };
  };

  const refetch = () => fetchInvestmentDetail();

  useEffect(() => {
    fetchInvestmentDetail();
  }, [investmentId]);

  return {
    investment,
    user,
    project,
    projectEvents,
    auditLog,
    loading,
    error,
    refetch,
  };
}
