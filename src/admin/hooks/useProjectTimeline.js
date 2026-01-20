import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useProjectTimeline(projectId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeline = async () => {
    if (!projectId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const timelineRef = collection(db, 'projects', projectId, 'timeline');
      const q = query(timelineRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setEvents(data);
    } catch (err) {
      console.error('Error en useProjectTimeline:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [projectId]);

  const addEvent = async (eventData) => {
    if (!projectId) return null;

    try {
      const timelineRef = collection(db, 'projects', projectId, 'timeline');
      const payload = {
        type: eventData.type || 'update',
        title: eventData.title || '',
        description: eventData.description || '',
        visibility: eventData.visibility || 'admin',
        createdBy: eventData.createdBy || null,
        metadata: eventData.metadata || null,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(timelineRef, payload);
      
      // Si el evento es visible a inversionistas, crear notificaciones
      if (payload.visibility === 'investors' || payload.visibility === 'all') {
        await createInvestorNotifications(projectId, docRef.id, payload);
      }

      await fetchTimeline();
      return docRef.id;
    } catch (err) {
      console.error('Error creando evento timeline:', err);
      throw err;
    }
  };

  const createInvestorNotifications = async (projectId, eventId, eventData) => {
    try {
      // Best-effort: include project name to disambiguate notifications.
      let projectName = null;
      try {
        const projectSnap = await getDoc(doc(db, 'projects', projectId));
        const project = projectSnap.exists() ? projectSnap.data() : null;
        projectName = project?.name || project?.title || project?.projectName || null;
      } catch (e) {
        // ignore
      }

      // Obtener inversiones activas del proyecto
      const investmentsRef = collection(db, 'investments');
      const investmentsQuery = query(
        investmentsRef,
        // where('projectId', '==', projectId), // Requiere índice
        // where('status', 'in', ['active', 'completed'])
      );
      const investmentsSnap = await getDocs(investmentsQuery);
      
      const investors = new Set();
      investmentsSnap.docs.forEach((doc) => {
        const inv = doc.data();
        if (inv.projectId === projectId && (inv.status === 'active' || inv.status === 'completed')) {
          investors.add(inv.userId);
        }
      });

      // Crear notificaciones para cada inversionista
      const promises = Array.from(investors).map((userId) =>
        addDoc(collection(db, 'users', userId, 'notifications'), {
          userId,
          projectId,
          projectName,
          eventId,
          type: 'project_update',
          title: eventData.title,
          message: eventData.description || eventData.title,
          read: false,
          createdAt: serverTimestamp(),
        })
      );

      await Promise.all(promises);
    } catch (err) {
      console.error('Error creando notificaciones:', err);
    }
  };

  const refetch = () => fetchTimeline();

  return { events, loading, error, addEvent, refetch };
}
