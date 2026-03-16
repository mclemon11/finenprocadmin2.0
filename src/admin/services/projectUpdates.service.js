import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/firebaseConfig';

/**
 * Get all updates for a project, ordered by createdAt desc
 */
export const getProjectUpdates = async (projectId) => {
  try {
    const q = query(
      collection(db, 'projectUpdates'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching projectUpdates:', err);
    return [];
  }
};

/**
 * Create a project update (status_update | profit | loss)
 * @param {Object} data - { projectId, type, title, description, amount?, files[] }
 * @returns {{ success: boolean, id?: string, error?: string }}
 */
export const createProjectUpdate = async ({
  projectId,
  type,
  title,
  description,
  amount,
  files,
}) => {
  try {
    // Upload media files
    const media = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file) continue;
        const safeName = String(file.name || 'file')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .slice(0, 120);
        const storagePath = `projectUpdates/${projectId}/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' });
        const url = await getDownloadURL(storageRef);
        media.push({
          url,
          path: storagePath,
          fileName: file.name || safeName,
          mimeType: file.type || 'application/octet-stream',
          size: file.size || 0,
        });
      }
    }

    const payload = {
      projectId,
      type, // 'status_update' | 'profit' | 'loss'
      title: title?.trim() || '',
      description: description?.trim() || '',
      amount: type === 'profit' ? Math.abs(Number(amount) || 0) : type === 'loss' ? -Math.abs(Number(amount) || 0) : null,
      media,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'projectUpdates'), payload);
    return { success: true, id: docRef.id };
  } catch (err) {
    console.error('Error creating projectUpdate:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Delete a project update and its media files
 */
export const deleteProjectUpdate = async (updateId, mediaArray = []) => {
  try {
    // Delete media from storage
    for (const m of mediaArray) {
      if (m?.path) {
        try {
          await deleteObject(ref(storage, m.path));
        } catch {
          // ignore
        }
      }
    }
    await deleteDoc(doc(db, 'projectUpdates', updateId));
    return { success: true };
  } catch (err) {
    console.error('Error deleting projectUpdate:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Calculate performance summary from project updates
 * @param {Array} updates - Array of projectUpdate docs
 * @param {number} expectedReturn - Expected return percentage (e.g. 10)
 * @param {string} returnPeriod - 'monthly' | 'quarterly' | 'yearly'
 * @returns {{ totalProfit, totalLoss, netReturn, expectedAmount, comparison }}
 */
export const calculatePerformanceSummary = (updates, expectedReturn, returnPeriod, totalInvested) => {
  const profits = updates.filter((u) => u.type === 'profit');
  const losses = updates.filter((u) => u.type === 'loss');

  const totalProfit = profits.reduce((sum, u) => sum + Math.abs(Number(u.amount) || 0), 0);
  const totalLoss = losses.reduce((sum, u) => sum + Math.abs(Number(u.amount) || 0), 0);
  const netReturn = totalProfit - totalLoss;

  // Calculate expected amount based on period count
  const now = new Date();
  const firstUpdate = updates.length > 0
    ? updates.reduce((oldest, u) => {
        const d = u.createdAt?.toDate?.() || new Date(u.createdAt);
        return d < oldest ? d : oldest;
      }, now)
    : now;

  const monthsDiff = Math.max(1, (now - firstUpdate) / (1000 * 60 * 60 * 24 * 30));
  let periodsElapsed = monthsDiff;
  if (returnPeriod === 'quarterly') periodsElapsed = monthsDiff / 3;
  else if (returnPeriod === 'yearly') periodsElapsed = monthsDiff / 12;

  const expectedPerPeriod = (totalInvested || 0) * ((expectedReturn || 0) / 100);
  const expectedAmount = expectedPerPeriod * periodsElapsed;

  let comparison = 'equal'; // 'above' | 'below' | 'equal'
  const tolerance = expectedAmount * 0.05; // 5% tolerance
  if (netReturn > expectedAmount + tolerance) comparison = 'above';
  else if (netReturn < expectedAmount - tolerance) comparison = 'below';

  return {
    totalProfit,
    totalLoss,
    netReturn,
    expectedAmount,
    periodsElapsed: Math.round(periodsElapsed * 10) / 10,
    comparison,
  };
};
