import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type { AccessRequest } from "./accessRequestService";

export interface UserDocument {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: "user";
  approved: true;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  approvedAt: Timestamp | ReturnType<typeof serverTimestamp>;
}

export async function getPendingAccessRequests(): Promise<AccessRequest[]> {
  try {
    const q = query(
      collection(db, "accessRequests"),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    const requests: AccessRequest[] = [];
    snapshot.forEach((docSnap) => {
      requests.push(docSnap.data() as AccessRequest);
    });
    return requests;
  } catch (err) {
    console.error("Error querying pending access requests:", err);
    // Fallback: fetch all accessRequests and filter manually
    const snapshot = await getDocs(collection(db, "accessRequests"));
    const requests: AccessRequest[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AccessRequest;
      if (!data.status || data.status === "pending") {
        requests.push(data);
      }
    });
    return requests;
  }
}

export async function approveAccessRequest(uid: string): Promise<void> {
  const reqRef = doc(db, "accessRequests", uid);
  const reqSnap = await getDoc(reqRef);

  if (!reqSnap.exists()) {
    throw new Error("Access request not found");
  }

  const reqData = reqSnap.data() as AccessRequest;

  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    uid: reqData.uid,
    displayName: reqData.displayName || "",
    email: reqData.email || "",
    photoURL: reqData.photoURL || "",
    role: "user",
    approved: true,
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
  });

  await deleteDoc(reqRef);
}

export async function rejectAccessRequest(uid: string): Promise<void> {
  const reqRef = doc(db, "accessRequests", uid);
  await deleteDoc(reqRef);
}

export async function getCurrentUserRole(uid: string): Promise<string | null> {
  if (!uid) return null;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    return data.role || "user";
  }
  return null;
}

export async function getApprovedUsers(): Promise<UserDocument[]> {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users: UserDocument[] = [];
    snapshot.forEach((docSnap) => {
      users.push(docSnap.data() as UserDocument);
    });
    return users;
  } catch (err) {
    console.error("Error fetching approved users:", err);
    return [];
  }
}


