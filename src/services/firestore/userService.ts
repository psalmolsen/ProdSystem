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
import type { User } from "firebase/auth";
import { formatDocIdFromDisplayName } from "@/utils/firestore";

export interface UserDocument {
  id?: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: "user" | "admin";
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
    const requestsMap = new Map<string, AccessRequest>();

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AccessRequest;
      const key = data.uid || docSnap.id;
      if (!requestsMap.has(key)) {
        requestsMap.set(key, {
          ...data,
          id: docSnap.id,
        });
      }
    });

    return Array.from(requestsMap.values());
  } catch (err) {
    console.error("Error querying pending access requests:", err);
    const snapshot = await getDocs(collection(db, "accessRequests"));
    const requestsMap = new Map<string, AccessRequest>();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AccessRequest;
      if (!data.status || data.status === "pending") {
        const key = data.uid || docSnap.id;
        if (!requestsMap.has(key)) {
          requestsMap.set(key, {
            ...data,
            id: docSnap.id,
          });
        }
      }
    });
    return Array.from(requestsMap.values());
  }
}

export async function approveAccessRequest(uid: string): Promise<void> {
  const q = query(collection(db, "accessRequests"), where("uid", "==", uid));
  const snap = await getDocs(q);
  let reqData: AccessRequest | null = null;
  let docToDeleteRefs: any[] = [];

  if (!snap.empty) {
    reqData = snap.docs[0].data() as AccessRequest;
    docToDeleteRefs = snap.docs.map((d) => d.ref);
  } else {
    const directSnap = await getDoc(doc(db, "accessRequests", uid));
    if (directSnap.exists()) {
      reqData = directSnap.data() as AccessRequest;
      docToDeleteRefs = [directSnap.ref];
    }
  }

  if (!reqData) {
    throw new Error("Access request not found");
  }

  // Document ID is equal to user's Display Name (e.g. "Virginia", "Psalm Olsen Naval")
  const userDocId = formatDocIdFromDisplayName(reqData.displayName, reqData.uid);
  const userRef = doc(db, "users", userDocId);

  await setDoc(userRef, {
    id: userDocId,
    uid: reqData.uid,
    displayName: reqData.displayName ?? "",
    email: reqData.email ?? "",
    photoURL: reqData.photoURL ?? "",
    role: "user",
    approved: true,
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
  });

  const deletePromises = docToDeleteRefs.map((ref) => deleteDoc(ref));
  await Promise.all(deletePromises);
}

export async function rejectAccessRequest(uid: string): Promise<void> {
  const q = query(collection(db, "accessRequests"), where("uid", "==", uid));
  const snap = await getDocs(q);
  let docToDeleteRefs: any[] = snap.docs.map((d) => d.ref);

  const directSnap = await getDoc(doc(db, "accessRequests", uid));
  if (directSnap.exists()) {
    docToDeleteRefs.push(directSnap.ref);
  }

  if (docToDeleteRefs.length > 0) {
    const deletePromises = docToDeleteRefs.map((ref) => deleteDoc(ref));
    await Promise.all(deletePromises);
  }
}

export async function getCurrentUserRole(userOrId: User | string): Promise<string | null> {
  if (!userOrId) return null;
  const uid = typeof userOrId === "string" ? userOrId : userOrId.uid;

  const q = query(collection(db, "users"), where("uid", "==", uid));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].data().role || "user";
  }

  // Direct doc check if document ID was uid
  const directSnap = await getDoc(doc(db, "users", uid));
  if (directSnap.exists()) {
    return directSnap.data().role || "user";
  }

  return null;
}

/**
 * Automatically migrates any legacy user document (e.g. SXXHpB5tqmf08TI46A4qdvKLKRC3)
 * to use the user's Display Name as Document ID (e.g. users/Psalm Olsen Naval).
 */
export async function migrateLegacyUserDocuments(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const migrationPromises: Promise<void>[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserDocument;
      const targetDocId = formatDocIdFromDisplayName(data.displayName, data.uid);

      // If current document ID is not equal to target Display Name Document ID
      if (docSnap.id !== targetDocId) {
        const newRef = doc(db, "users", targetDocId);

        console.log(`Migrating user document ${docSnap.id} -> ${targetDocId}`);

        migrationPromises.push(
          setDoc(newRef, {
            ...data,
            id: targetDocId,
          }).then(() => deleteDoc(docSnap.ref))
        );
      }
    });

    if (migrationPromises.length > 0) {
      await Promise.all(migrationPromises);
    }
  } catch (err) {
    console.error("Error migrating legacy user documents:", err);
  }
}

export async function getApprovedUsers(): Promise<UserDocument[]> {
  try {
    // Run automated migration so legacy UID document IDs are converted to Display Name document IDs
    await migrateLegacyUserDocuments();

    const snapshot = await getDocs(collection(db, "users"));
    const users: UserDocument[] = [];
    snapshot.forEach((docSnap) => {
      users.push({
        ...(docSnap.data() as UserDocument),
        id: docSnap.id,
      });
    });
    return users;
  } catch (err) {
    console.error("Error fetching approved users:", err);
    return [];
  }
}
