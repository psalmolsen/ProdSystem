import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/firebase/firebase";

export interface AccessRequest {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: Timestamp | ReturnType<typeof serverTimestamp>;
}

export async function checkUserExists(uid: string): Promise<boolean> {
  if (!uid) return false;
  const userDocRef = doc(db, "users", uid);
  const snap = await getDoc(userDocRef);
  return snap.exists();
}

export async function getAccessRequest(
  uid: string
): Promise<AccessRequest | null> {
  if (!uid) return null;
  const reqDocRef = doc(db, "accessRequests", uid);
  const snap = await getDoc(reqDocRef);
  if (snap.exists()) {
    return snap.data() as AccessRequest;
  }
  return null;
}

export async function createAccessRequest(user: User): Promise<void> {
  if (!user || !user.uid) return;

  const existingReq = await getAccessRequest(user.uid);
  if (existingReq) {
    // Access request already exists, do not overwrite or create duplicate
    return;
  }

  const reqDocRef = doc(db, "accessRequests", user.uid);
  await setDoc(reqDocRef, {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    status: "pending",
    requestedAt: serverTimestamp(),
  });
}
