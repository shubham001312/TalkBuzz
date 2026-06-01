import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: The applet requires firestoreDatabaseId passed manually to ensure correct database target sandbox
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard popup login
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    const isExpectedPopupError = 
      err.code === 'auth/cancelled-popup-request' ||
      err.code === 'auth/popup-blocked' ||
      err.code === 'auth/popup-closed-by-user' ||
      (err.message && (
        err.message.includes('popup-blocked') ||
        err.message.includes('cancelled-popup-request') ||
        err.message.includes('popup-closed-by-user') ||
        err.message.includes('popup closed by user')
      ));

    if (isExpectedPopupError) {
      console.warn("Firebase Signin (Iframe/User Cancelled Safe Fallback): ", err.message || err);
    } else {
      console.error("Firebase Signin Error: ", err);
    }
    throw err;
  }
}
