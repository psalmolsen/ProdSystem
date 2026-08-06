import {
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type { JobOrderStatus } from "@/constants/statuses";
import type { CreateJobOrderInput, JobOrder, UpdateJobOrderInput } from "@/types/jobOrder";
import { formatTimestamp, generateJobOrderId, getJobOrderDocRef } from "@/utils";

const COLLECTION_NAME = "jobOrders";

/**
 * Creates a new Job Order document in Firestore using server timestamps.
 * IMPORTANT: Does NOT create a production document.
 */
export async function createJobOrder(
  input: CreateJobOrderInput,
): Promise<JobOrder> {
  const joId = generateJobOrderId();
  const docRef = getJobOrderDocRef(joId);
  const nowIso = new Date().toISOString();

  const joData: JobOrder = {
    id: joId,
    workOrder: input.workOrder.trim(),
    brand: input.brand.trim(),
    status: input.status || "Pending",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await setDoc(docRef, {
    workOrder: joData.workOrder,
    brand: joData.brand,
    status: joData.status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return joData;
}

/**
 * Fetches a single Job Order by ID from Firestore.
 */
export async function getJobOrder(jobOrderId: string): Promise<JobOrder | null> {
  const docRef = getJobOrderDocRef(jobOrderId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const raw = snap.data();
  return {
    id: snap.id,
    workOrder: String(raw.workOrder || snap.id),
    brand: String(raw.brand || ""),
    status: (raw.status as JobOrderStatus) || "Pending",
    createdAt: formatTimestamp(raw.createdAt),
    updatedAt: formatTimestamp(raw.updatedAt),
  };
}

/**
 * Queries Job Orders with status filtering, search filtering, and pagination support.
 */
export async function getAllJobOrders(options?: {
  status?: JobOrderStatus | "All";
  searchQuery?: string;
  limitCount?: number;
}): Promise<JobOrder[]> {
  const colRef = collection(db, COLLECTION_NAME);
  const constraints = [];

  if (options?.status && options.status !== "All") {
    constraints.push(where("status", "==", options.status));
  }

  constraints.push(orderBy("createdAt", "desc"));

  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  const q = query(colRef, ...constraints);
  const snap = await getDocs(q);

  let results: JobOrder[] = snap.docs.map((docSnap) => {
    const raw = docSnap.data();
    return {
      id: docSnap.id,
      workOrder: String(raw.workOrder || docSnap.id),
      brand: String(raw.brand || ""),
      status: (raw.status as JobOrderStatus) || "Pending",
      createdAt: formatTimestamp(raw.createdAt),
      updatedAt: formatTimestamp(raw.updatedAt),
    };
  });

  if (options?.searchQuery && options.searchQuery.trim().length > 0) {
    const qLower = options.searchQuery.trim().toLowerCase();
    results = results.filter(
      (jo) =>
        jo.workOrder.toLowerCase().includes(qLower) ||
        jo.brand.toLowerCase().includes(qLower) ||
        jo.id.toLowerCase().includes(qLower),
    );
  }

  return results;
}

/**
 * Updates Job Order header fields in Firestore.
 */
export async function updateJobOrder(
  jobOrderId: string,
  input: UpdateJobOrderInput,
): Promise<void> {
  const docRef = getJobOrderDocRef(jobOrderId);
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.workOrder !== undefined) payload.workOrder = input.workOrder.trim();
  if (input.brand !== undefined) payload.brand = input.brand.trim();
  if (input.status !== undefined) payload.status = input.status;

  await updateDoc(docRef, payload);
}
