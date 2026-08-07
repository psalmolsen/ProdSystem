import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type { Backjob, BackjobStatus, CreateBackjobInput, UpdateBackjobInput } from "@/types/backjob";
import { formatTimestamp } from "@/utils";

const COLLECTION_NAME = "backjobs";

export function generateBackjobId(): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `BJ-${randomSuffix}`;
}

export function getBackjobDocRef(backjobId: string) {
  return doc(db, COLLECTION_NAME, backjobId);
}

/**
 * Creates a new Backjob document in Firestore under `backjobs/{backjobId}`.
 */
export async function createBackjob(input: CreateBackjobInput): Promise<Backjob> {
  const rawBjNumber = input.backjobNumber?.trim() || "";
  const backjobId = rawBjNumber
    ? (rawBjNumber.toUpperCase().startsWith("BJ-") ? rawBjNumber.toUpperCase() : `BJ-${rawBjNumber}`)
    : generateBackjobId();

  const docRef = getBackjobDocRef(backjobId);
  const nowIso = new Date().toISOString();

  const joNumberVal = input.joNumber.trim().toUpperCase().startsWith("JO-")
    ? input.joNumber.trim().toUpperCase()
    : `JO-${input.joNumber.trim()}`;

  const brandVal = input.brand.trim();
  const reworksVal = input.reworksToPerform.trim();
  const qtyVal = Math.max(0, Number(input.qty) || 0);
  const reasonVal = input.reason?.trim() || "";
  const statusVal = input.status || "Pending";

  await setDoc(docRef, {
    joNumber: joNumberVal,
    brand: brandVal,
    reworksToPerform: reworksVal,
    qty: qtyVal,
    reason: reasonVal,
    status: statusVal,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: backjobId,
    joNumber: joNumberVal,
    brand: brandVal,
    reworksToPerform: reworksVal,
    qty: qtyVal,
    reason: reasonVal,
    status: statusVal,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Fetches a single Backjob by ID from Firestore.
 */
export async function getBackjob(backjobId: string): Promise<Backjob | null> {
  const docRef = getBackjobDocRef(backjobId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const raw = snap.data();
  return {
    id: snap.id,
    joNumber: String(raw.joNumber || ""),
    brand: String(raw.brand || ""),
    reworksToPerform: String(raw.reworksToPerform || ""),
    qty: Number(raw.qty) || 0,
    reason: String(raw.reason || ""),
    status: (raw.status as BackjobStatus) || "Pending",
    createdAt: formatTimestamp(raw.createdAt),
    updatedAt: formatTimestamp(raw.updatedAt),
  };
}

/**
 * Queries Backjobs with status filtering, search filtering, and pagination support.
 */
export async function getAllBackjobs(options?: {
  status?: BackjobStatus | "All";
  searchQuery?: string;
  limitCount?: number;
}): Promise<Backjob[]> {
  const colRef = collection(db, COLLECTION_NAME);
  let snap;

  try {
    const constraints = [];
    if (options?.status && options.status !== "All") {
      constraints.push(where("status", "==", options.status));
    }
    constraints.push(orderBy("createdAt", "desc"));
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    const q = query(colRef, ...constraints);
    snap = await getDocs(q);
  } catch {
    // Fallback without orderBy constraint if index is missing in Firestore
    const constraints = [];
    if (options?.status && options.status !== "All") {
      constraints.push(where("status", "==", options.status));
    }
    const q = query(colRef, ...constraints);
    snap = await getDocs(q);
  }

  let results: Backjob[] = snap.docs.map((docSnap) => {
    const raw = docSnap.data();
    return {
      id: docSnap.id,
      joNumber: String(raw.joNumber || ""),
      brand: String(raw.brand || ""),
      reworksToPerform: String(raw.reworksToPerform || ""),
      qty: Number(raw.qty) || 0,
      reason: String(raw.reason || ""),
      status: (raw.status as BackjobStatus) || "Pending",
      createdAt: formatTimestamp(raw.createdAt),
      updatedAt: formatTimestamp(raw.updatedAt),
    };
  });

  if (options?.searchQuery && options.searchQuery.trim().length > 0) {
    const qLower = options.searchQuery.trim().toLowerCase();
    results = results.filter(
      (bj) =>
        bj.id.toLowerCase().includes(qLower) ||
        bj.joNumber.toLowerCase().includes(qLower) ||
        bj.brand.toLowerCase().includes(qLower) ||
        bj.reworksToPerform.toLowerCase().includes(qLower) ||
        bj.reason?.toLowerCase().includes(qLower),
    );
  }

  return results;
}

/**
 * Updates a Backjob document in Firestore.
 */
export async function updateBackjob(
  backjobId: string,
  input: UpdateBackjobInput,
): Promise<void> {
  const docRef = getBackjobDocRef(backjobId);
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.joNumber !== undefined) payload.joNumber = input.joNumber.trim();
  if (input.brand !== undefined) payload.brand = input.brand.trim();
  if (input.reworksToPerform !== undefined) payload.reworksToPerform = input.reworksToPerform.trim();
  if (input.qty !== undefined) payload.qty = Math.max(0, Number(input.qty) || 0);
  if (input.reason !== undefined) payload.reason = input.reason.trim();
  if (input.status !== undefined) payload.status = input.status;

  await updateDoc(docRef, payload);
}

/**
 * Deletes a Backjob document in Firestore.
 */
export async function deleteBackjob(backjobId: string): Promise<void> {
  const docRef = getBackjobDocRef(backjobId);
  await deleteDoc(docRef);
}
