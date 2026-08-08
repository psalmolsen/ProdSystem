import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type Unsubscribe,
  type UserCredential,
} from "firebase/auth";
import { app } from "./firebase";

export const auth = getAuth(app);

// Safe persistence fallback for mobile devices and restricted browsers
setPersistence(auth, [
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
]).catch((err) => {
  console.warn("Failed to set auth persistence:", err);
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function checkRedirectResult(): Promise<UserCredential | null> {
  try {
    return await getRedirectResult(auth);
  } catch (err) {
    console.error("Error handling auth redirect result:", err);
    return null;
  }
}

export async function signIn(): Promise<UserCredential | void> {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    console.warn("Popup sign-in failed, attempting redirect fallback:", err);
    await signInWithRedirect(auth, googleProvider);
  }
}

export async function signOut(): Promise<void> {
  return await firebaseSignOut(auth);
}

export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}
