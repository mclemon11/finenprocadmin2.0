import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../../firebase/firebaseConfig';

const COLLECTION = 'advisors';
const DOC_ID = 'main'; // legacy single advisor document

// ─── LEGACY SINGLE-ADVISOR (for backwards compatibility) ────────────

/**
 * Fetch the legacy single advisor profile
 */
export const getAdvisor = async () => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (!snap.exists()) return { success: true, data: null };
    return { success: true, data: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create or update the legacy single advisor profile
 */
export const saveAdvisor = async (data) => {
  try {
    await setDoc(doc(db, COLLECTION, DOC_ID), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Upload photo for legacy single advisor
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

// ─── MULTI-ADVISOR CRUD ─────────────────────────────────────────────

/**
 * Get all advisors (excluding the legacy 'main' doc if it has no name)
 */
export const getAllAdvisors = async () => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const advisors = [];
    snap.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      advisors.push(data);
    });
    return { success: true, data: advisors };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get a single advisor by ID
 */
export const getAdvisorById = async (advisorId) => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, advisorId));
    if (!snap.exists()) return { success: true, data: null };
    return { success: true, data: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create a new advisor
 * @param {{ name: string, phone: string, email?: string, specialty?: string }} data
 * @param {File|null} photoFile
 */
export const createAdvisor = async (data, photoFile = null) => {
  try {
    const payload = {
      name: data.name?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      specialty: data.specialty?.trim() || '',
      photoUrl: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION), payload);

    if (photoFile) {
      const timestamp = Date.now();
      const ext = photoFile.name.split('.').pop();
      const storagePath = `advisors/${docRef.id}/photo_${timestamp}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, photoFile);
      const photoUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(db, COLLECTION, docRef.id), { photoUrl });
      payload.photoUrl = photoUrl;
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing advisor
 * @param {string} advisorId
 * @param {{ name?: string, phone?: string, email?: string, specialty?: string }} data
 * @param {File|null} photoFile - new photo (null = keep existing)
 */
export const updateAdvisor = async (advisorId, data, photoFile = null) => {
  try {
    const payload = {
      updatedAt: serverTimestamp(),
    };
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.phone !== undefined) payload.phone = data.phone.trim();
    if (data.email !== undefined) payload.email = data.email.trim();
    if (data.specialty !== undefined) payload.specialty = data.specialty.trim();

    if (photoFile) {
      const timestamp = Date.now();
      const ext = photoFile.name.split('.').pop();
      const storagePath = `advisors/${advisorId}/photo_${timestamp}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, photoFile);
      payload.photoUrl = await getDownloadURL(storageRef);
    }

    await updateDoc(doc(db, COLLECTION, advisorId), payload);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete an advisor
 * @param {string} advisorId
 * @param {string} photoUrl - optional, to delete from storage
 */
export const deleteAdvisor = async (advisorId, photoUrl = '') => {
  try {
    // Try to delete the photo from Storage
    if (photoUrl) {
      try {
        const storageRef = ref(storage, photoUrl);
        await deleteObject(storageRef);
      } catch (_) { /* photo may not exist */ }
    }
    await deleteDoc(doc(db, COLLECTION, advisorId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Upload/replace photo for a specific advisor
 */
export const uploadAdvisorPhotoById = async (advisorId, file) => {
  try {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const storagePath = `advisors/${advisorId}/photo_${timestamp}.${ext}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const photoUrl = await getDownloadURL(storageRef);
    await updateDoc(doc(db, COLLECTION, advisorId), { photoUrl, updatedAt: serverTimestamp() });
    return { success: true, photoUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
