import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

/* ========================================
   PROJECT TASKS
   ======================================== */

/**
 * Subscribe to tasks for a project (real-time)
 */
export function subscribeProjectTasks(projectId, callback) {
  const tasksRef = collection(db, 'projectTasks');
  const q = query(tasksRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(tasks);
  });
}

/**
 * Create a new task
 */
export async function createTask(taskData) {
  const tasksRef = collection(db, 'projectTasks');
  const docRef = await addDoc(tasksRef, {
    ...taskData,
    status: taskData.status || 'pending',
    priority: taskData.priority || 'medium',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a task
 */
export async function updateTask(taskId, updates) {
  const ref = doc(db, 'projectTasks', taskId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a task
 */
export async function deleteTask(taskId) {
  const ref = doc(db, 'projectTasks', taskId);
  await deleteDoc(ref);
}

/**
 * Get a single task
 */
export async function getTask(taskId) {
  const ref = doc(db, 'projectTasks', taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Get all tasks (admin overview)
 */
export async function getAllTasks() {
  const tasksRef = collection(db, 'projectTasks');
  const q = query(tasksRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get tasks assigned to a specific user
 */
export function subscribeUserTasks(userId, callback) {
  const tasksRef = collection(db, 'projectTasks');
  const q = query(tasksRef, where('assignedTo', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(tasks);
  });
}
