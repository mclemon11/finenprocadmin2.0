import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Get all users with a specific KYC status
 */
export const getUsersByKycStatus = async (status = 'pending') => {
  try {
    const q = query(
      collection(db, 'users'),
      where('kycStatus', '==', status),
      orderBy('kycSubmittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return {
      success: true,
      data: snapshot.docs.map((d) => ({ uid: d.id, ...d.data() })),
    };
  } catch (error) {
    console.error('Error fetching users by KYC status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get KYC documents from the subcollection for a specific user
 */
export const getKycDocuments = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid, 'kyc', 'documents');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: true, data: {} };
  } catch (error) {
    console.error('Error fetching KYC documents:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get full KYC profile for a user (user doc fields + KYC documents)
 */
export const getFullKycProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();
    const docsResult = await getKycDocuments(uid);

    return {
      success: true,
      data: {
        uid,
        type: userData.type,
        fullName: userData.fullName,
        documentType: userData.documentType,
        documentNumber: userData.documentNumber,
        country: userData.country,
        address: userData.address,
        companyName: userData.companyName,
        taxId: userData.taxId,
        legalRepresentative: userData.legalRepresentative,
        kycStatus: userData.kycStatus,
        kycSubmittedAt: userData.kycSubmittedAt,
        kycReviewedAt: userData.kycReviewedAt,
        kycRejectionReason: userData.kycRejectionReason,
        documents: docsResult.success ? docsResult.data : {},
      },
    };
  } catch (error) {
    console.error('Error fetching full KYC profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Approve a user's KYC
 */
export const approveKyc = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      kycStatus: 'approved',
      kycReviewedAt: serverTimestamp(),
      kycRejectionReason: null,
    });
    return { success: true };
  } catch (error) {
    console.error('Error approving KYC:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject a user's KYC with a reason
 */
export const rejectKyc = async (uid, reason = '') => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      kycStatus: 'rejected',
      kycReviewedAt: serverTimestamp(),
      kycRejectionReason: reason,
    });
    return { success: true };
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get count of pending KYC users (for badge/notification)
 */
export const getPendingKycCount = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('kycStatus', '==', 'pending'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error getting pending KYC count:', error);
    return { success: false, count: 0 };
  }
};
