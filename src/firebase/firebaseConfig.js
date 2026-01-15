import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize once and reuse the existing app instance if present (Vite/HMR-safe)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Secondary auth instance used for provisioning (creating) new users from an admin session
// without switching the currently signed-in admin.
const PROVISIONING_APP_NAME = 'provisioning';
const getProvisioningApp = () => {
  const existing = getApps().find((a) => a.name === PROVISIONING_APP_NAME);
  return existing || initializeApp(firebaseConfig, PROVISIONING_APP_NAME);
};

export const getProvisioningAuth = () => getAuth(getProvisioningApp());

// Debug startup: log essential Firebase project info
try {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    console.warn('Firebase env variables missing:', missing);
  }
  console.log('Firebase initialized', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasAuth: !!auth,
    hasDb: !!db,
    hasStorage: !!storage,
  });
} catch (e) {
  console.warn('Firebase init debug failed:', e);
}

export { app, auth, db, storage };
