import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

/* ========================================
   PROJECT MEMBERS
   ======================================== */

/**
 * Get project members array from project doc
 */
export async function getProjectMembers(projectId) {
  const ref = doc(db, 'projects', projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const data = snap.data();
  return data.members || [];
}

/**
 * Add a member to a project
 * Also updates memberIds array for security rules
 */
export async function addProjectMember(projectId, member) {
  const ref = doc(db, 'projects', projectId);
  await updateDoc(ref, {
    members: arrayUnion(member),
    memberIds: arrayUnion(member.userId),
  });
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(projectId, member) {
  const ref = doc(db, 'projects', projectId);
  await updateDoc(ref, {
    members: arrayRemove(member),
    memberIds: arrayRemove(member.userId),
  });
}

/**
 * Update a member's role — remove old, add new
 */
export async function updateMemberRole(projectId, userId, oldMember, newRole) {
  const ref = doc(db, 'projects', projectId);
  await updateDoc(ref, {
    members: arrayRemove(oldMember),
  });
  await updateDoc(ref, {
    members: arrayUnion({ ...oldMember, role: newRole }),
  });
}

/* ========================================
   PROJECT CHATS
   ======================================== */

/**
 * Subscribe to project chat messages (real-time)
 */
export function subscribeProjectChat(projectId, callback) {
  const messagesRef = collection(db, 'projectChats', projectId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(messages);
  });
}

/**
 * Send a message to a project chat
 */
export async function sendProjectMessage(projectId, senderId, senderName, text, senderPhoto) {
  const messagesRef = collection(db, 'projectChats', projectId, 'messages');
  await addDoc(messagesRef, {
    senderId,
    senderName: senderName || '',
    senderPhoto: senderPhoto || '',
    text,
    createdAt: serverTimestamp(),
  });
}

/* ========================================
   PRIVATE CHATS
   ======================================== */

/**
 * Get or create a private chat between two users
 */
export async function getOrCreatePrivateChat(user1Id, user2Id, user1Name, user2Name, user1Photo, user2Photo) {
  // Check if chat already exists
  const chatsRef = collection(db, 'privateChats');
  const q = query(chatsRef, where('participants', 'array-contains', user1Id));
  const snap = await getDocs(q);

  for (const d of snap.docs) {
    const data = d.data();
    if (data.participants.includes(user2Id)) {
      return { id: d.id, ...data };
    }
  }

  // Create new chat
  const newChat = {
    participants: [user1Id, user2Id],
    participantNames: {
      [user1Id]: user1Name || '',
      [user2Id]: user2Name || '',
    },
    participantPhotos: {
      [user1Id]: user1Photo || '',
      [user2Id]: user2Photo || '',
    },
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageAt: null,
  };
  const docRef = await addDoc(chatsRef, newChat);
  return { id: docRef.id, ...newChat };
}

/**
 * Subscribe to all private chats for a user (admin sees all)
 */
export function subscribePrivateChats(callback, userId = null) {
  const chatsRef = collection(db, 'privateChats');
  let q;
  if (userId) {
    q = query(chatsRef, where('participants', 'array-contains', userId), orderBy('lastMessageAt', 'desc'));
  } else {
    // Admin: get all chats, ordered by last activity
    q = query(chatsRef, orderBy('lastMessageAt', 'desc'));
  }
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(chats);
  });
}

/**
 * Subscribe to messages in a private chat (real-time)
 */
export function subscribePrivateChatMessages(chatId, callback) {
  const messagesRef = collection(db, 'privateChats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(messages);
  });
}

/**
 * Send a message in a private chat
 */
export async function sendPrivateMessage(chatId, senderId, senderName, text, senderPhoto) {
  const messagesRef = collection(db, 'privateChats', chatId, 'messages');
  await addDoc(messagesRef, {
    senderId,
    senderName: senderName || '',
    senderPhoto: senderPhoto || '',
    text,
    createdAt: serverTimestamp(),
  });

  // Update last message on chat doc
  const chatRef = doc(db, 'privateChats', chatId);
  await updateDoc(chatRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });
}

/**
 * Get all private chats (for admin listing)
 */
export async function getAllPrivateChats() {
  const chatsRef = collection(db, 'privateChats');
  const snap = await getDocs(chatsRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
