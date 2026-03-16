import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const CONTACTS_COL = 'contacts';
const TAGS_COL = 'tags';

// ─── CONTACTS ────────────────────────────────────────────────

/**
 * Get all contacts
 */
export const getAllContacts = async () => {
  try {
    const q = query(collection(db, CONTACTS_COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return {
      success: true,
      data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get a single contact by ID
 */
export const getContactById = async (contactId) => {
  try {
    const snap = await getDoc(doc(db, CONTACTS_COL, contactId));
    if (!snap.exists()) return { success: false, error: 'Contact not found' };
    return { success: true, data: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Check if a user already has a contact record
 */
export const getContactByUserId = async (userId) => {
  try {
    const q = query(collection(db, CONTACTS_COL), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (snap.empty) return { success: true, data: null };
    const d = snap.docs[0];
    return { success: true, data: { id: d.id, ...d.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create a new contact linked to a user.
 * Validates that the user doesn't already have a contact.
 * @param {object} data - { userId, displayName, email, location, expertise, tags[] }
 */
export const createContact = async (data) => {
  try {
    if (!data.userId) return { success: false, error: 'userId is required' };

    // Check uniqueness
    const existing = await getContactByUserId(data.userId);
    if (existing.success && existing.data) {
      return { success: false, error: 'ALREADY_EXISTS' };
    }

    const payload = {
      userId: data.userId,
      displayName: data.displayName || '',
      email: data.email || '',
      phone: data.phone || '',
      location: data.location || '',
      expertise: data.expertise || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      notes: data.notes || '',
      photoUrl: data.photoUrl || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, CONTACTS_COL), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing contact
 */
export const updateContact = async (contactId, data) => {
  try {
    const ref = doc(db, CONTACTS_COL, contactId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete a contact
 */
export const deleteContact = async (contactId) => {
  try {
    await deleteDoc(doc(db, CONTACTS_COL, contactId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── TAGS ────────────────────────────────────────────────────

/**
 * Get all tags
 */
export const getAllTags = async () => {
  try {
    const q = query(collection(db, TAGS_COL), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return {
      success: true,
      data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create a tag
 */
export const createTag = async (name, color = '#6366f1') => {
  try {
    if (!name?.trim()) return { success: false, error: 'Tag name is required' };

    // Check if tag already exists (case-insensitive)
    const existing = await getAllTags();
    if (existing.success) {
      const dup = existing.data.find(
        (t) => t.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (dup) return { success: false, error: 'TAG_EXISTS' };
    }

    const docRef = await addDoc(collection(db, TAGS_COL), {
      name: name.trim(),
      color,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, data: { id: docRef.id, name: name.trim(), color } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete a tag
 */
export const deleteTag = async (tagId) => {
  try {
    await deleteDoc(doc(db, TAGS_COL, tagId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── NOTIFICATIONS ───────────────────────────────────────────

/**
 * Send a notification to a user when they're added as a contact to a project.
 * Writes to /users/{userId}/notifications subcollection.
 */
export const notifyContactAddedToProject = async (userId, projectName, projectId) => {
  try {
    if (!userId) return { success: false, error: 'userId required' };

    const notifRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notifRef, {
      userId,
      type: 'contact_project',
      title: 'Has sido añadido a un proyecto',
      message: `Has sido agregado como contacto al proyecto "${projectName}".`,
      projectId: projectId || null,
      projectName: projectName || '',
      read: false,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
