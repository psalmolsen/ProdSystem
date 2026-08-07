import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type Unsubscribe,
  type UserCredential,
} from "firebase/auth";
import { app } from "./firebase";

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function signIn(): Promise<UserCredential> {
  return await signInWithPopup(auth, googleProvider);
}

export async function signOut(): Promise<void> {
  return await firebaseSignOut(auth);
}

export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}
