import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const COLLECTION = 'settings';
const DOC_ID = 'platform';

/**
 * Fetch platform settings (terms & conditions, etc.)
 */
export const getPlatformSettings = async () => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (!snap.exists()) return { success: true, data: null };
    return { success: true, data: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Save platform settings (merge)
 */
export const savePlatformSettings = async (data) => {
  try {
    await setDoc(
      doc(db, COLLECTION, DOC_ID),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
