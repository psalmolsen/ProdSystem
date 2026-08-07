import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/firebase/firebase";
import { formatDocIdFromDisplayName } from "@/utils/firestore";

export interface AccessRequest {
  id?: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: Timestamp | ReturnType<typeof serverTimestamp>;
}

export async function checkUserExists(uid: string): Promise<boolean> {
  if (!uid) return false;
  const q = query(collection(db, "users"), where("uid", "==", uid));
  const snap = await getDocs(q);
  if (!snap.empty) return true;

  const userDocRef = doc(db, "users", uid);
  const directSnap = await getDoc(userDocRef);
  return directSnap.exists();
}

export async function getAccessRequest(
  userOrUid: User | string
): Promise<AccessRequest | null> {
  const uid = typeof userOrUid === "string" ? userOrUid : userOrUid.uid;
  if (!uid) return null;

  // 1. Query access requests by internal uid field
  const q = query(collection(db, "accessRequests"), where("uid", "==", uid));
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    return querySnap.docs[0].data() as AccessRequest;
  }

  // 2. Direct doc snap check by doc ID
  const directSnap = await getDoc(doc(db, "accessRequests", uid));
  if (directSnap.exists()) {
    return directSnap.data() as AccessRequest;
  }

  return null;
}

/**
 * Creates an access request using the user's Display Name as custom Document ID (e.g. accessRequests/Virginia).
 */
export async function createAccessRequest(user: User): Promise<AccessRequest | null> {
  if (!user || !user.uid) return null;

  // Check if request already exists for this UID
  const existingReq = await getAccessRequest(user.uid);
  if (existingReq) {
    return existingReq;
  }

  // Document ID is equal to user's Display Name (e.g. "Virginia", "Psalm Olsen Naval")
  const reqDocId = formatDocIdFromDisplayName(user.displayName, user.uid);
  const requestRef = doc(db, "accessRequests", reqDocId);

  const newRequest = {
    id: reqDocId,
    uid: user.uid,
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    status: "pending" as const,
    requestedAt: serverTimestamp(),
  };

  await setDoc(requestRef, newRequest);
  return newRequest;
}
