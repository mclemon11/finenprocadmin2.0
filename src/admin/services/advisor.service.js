import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { db, storage } from '../../firebase/firebaseConfig';

const COLLECTION = 'advisors';
const DOC_ID = 'main'; // single advisor document

/**
 * Fetch the advisor profile
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getAdvisor = async () => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (!snap.exists()) {
      return { success: true, data: null };
    }
    return { success: true, data: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create or update the advisor profile
 * @param {object} data - { name, phone }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const saveAdvisor = async (data) => {
  try {
    await setDoc(
      doc(db, COLLECTION, DOC_ID),
      {
        ...data,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Upload advisor photo and update Firestore record
 * @param {File} file - Image file
 * @returns {Promise<{success: boolean, photoUrl?: string, error?: string}>}
 */
export const uploadAdvisorPhoto = async (file) => {
  try {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const storagePath = `advisors/${DOC_ID}/photo_${timestamp}.${ext}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const photoUrl = await getDownloadURL(storageRef);
    await saveAdvisor({ photoUrl });
    return { success: true, photoUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
