import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const getAllTopups = async (filters = {}) => {
  try {
    const conditions = [orderBy('createdAt', 'desc')];

    if (filters.status) {
      conditions.unshift(where('status', '==', filters.status));
    }

    if (filters.userId) {
      conditions.unshift(where('userId', '==', filters.userId));
    }

    const q = query(
      collection(db, 'topups'),
      ...conditions
    );

    const querySnapshot = await getDocs(q);
    const topups = [];

    for (const docSnap of querySnapshot.docs) {
      const topupData = docSnap.data();

      let user = null;
      if (topupData.userId) {
        const userRef = doc(db, 'users', topupData.userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          user = {
            uid: userDoc.id,
            email: userDoc.data().email,
            displayName: userDoc.data().displayName || 'Sin nombre'
          };
        }
      }

      let method = null;
      if (topupData.methodId) {
        const methodRef = doc(db, 'rechargeMethods', topupData.methodId);
        const methodDoc = await getDoc(methodRef);
        if (methodDoc.exists()) {
          method = {
            id: methodDoc.id,
            name: methodDoc.data().name,
            icon: methodDoc.data().icon
          };
        }
      }

      topups.push({
        topupId: docSnap.id,
        id: docSnap.id,
        amount: topupData.amount,
        status: topupData.status,
        createdAt: topupData.createdAt?.toDate(),
        user,
        method,
        receiptUrl: topupData.receiptUrl,
        userId: topupData.userId,
        methodId: topupData.methodId
      });
    }

    return { success: true, data: topups };
  } catch (error) {
    console.error('Error fetching topups:', error);
    return { success: false, error: error.message };
  }
};
