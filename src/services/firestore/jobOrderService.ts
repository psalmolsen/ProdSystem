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
import type { CreateJobOrderInput, JobOrder, UpdateJobOrderInput, OtherWorkOrderItem } from "@/types/jobOrder";
import { formatTimestamp, generateJobOrderId, getJobOrderDocRef } from "@/utils";

const COLLECTION_NAME = "jobOrders";

function sanitizeOtherItems(items?: OtherWorkOrderItem[]): OtherWorkOrderItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item.label === "string" && item.label.trim().length > 0)
    .map((item) => ({
      label: item.label.trim(),
      qty: Math.max(0, Number(item.qty) || 0),
    }));
}

/**
 * Creates a new Job Order document in Firestore with custom JO#, Brand, CNF, CF, CN, and custom Other items.
 */
export async function createJobOrder(
  input: CreateJobOrderInput,
): Promise<JobOrder> {
  const rawJoNumber = input.joNumber?.trim() || input.workOrder?.trim() || "";
  let joId = "";
  if (rawJoNumber) {
    const cleanNum = rawJoNumber.toUpperCase().replace(/^(JO|WO)-?/, "");
    joId = `JO-${cleanNum || rawJoNumber.toUpperCase()}`;
  } else {
    joId = generateJobOrderId();
  }

  const docRef = getJobOrderDocRef(joId);
  const nowIso = new Date().toISOString();

  const workOrderVal = input.workOrder?.trim() || `WO-${joId.replace(/^JO-/, "")}`;
  const brandVal = input.brand ? input.brand.trim() : "Standard";
  const cnfVal = Number(input.cnf) || 0;
  const cfVal = Number(input.cf) || 0;
  const cnVal = Number(input.cn) || 0;
  const otherItemsVal = sanitizeOtherItems(input.otherItems);
  const statusVal = input.status || "Active";

  await setDoc(docRef, {
    workOrder: workOrderVal,
    brand: brandVal,
    cnf: cnfVal,
    cf: cfVal,
    cn: cnVal,
    c: cnVal,
    otherItems: otherItemsVal,
    status: statusVal,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: joId,
    workOrder: workOrderVal,
    brand: brandVal,
    cnf: cnfVal,
    cf: cfVal,
    cn: cnVal,
    c: cnVal,
    otherItems: otherItemsVal,
    status: statusVal,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Fetches a single Job Order by ID from Firestore.
 */
export async function getJobOrder(jobOrderId: string): Promise<JobOrder | null> {
  const docRef = getJobOrderDocRef(jobOrderId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const raw = snap.data();
  const cnParsed = Number(raw.cn ?? raw.c) || 0;
  return {
    id: snap.id,
    workOrder: String(raw.workOrder || snap.id),
    brand: String(raw.brand || ""),
    cnf: Number(raw.cnf) || 0,
    cf: Number(raw.cf) || 0,
    cn: cnParsed,
    c: cnParsed,
    otherItems: sanitizeOtherItems(raw.otherItems),
    status: (raw.status as JobOrderStatus) || "Active",
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
    const cnParsed = Number(raw.cn ?? raw.c) || 0;
    return {
      id: docSnap.id,
      workOrder: String(raw.workOrder || docSnap.id),
      brand: String(raw.brand || ""),
      cnf: Number(raw.cnf) || 0,
      cf: Number(raw.cf) || 0,
      cn: cnParsed,
      c: cnParsed,
      otherItems: sanitizeOtherItems(raw.otherItems),
      status: (raw.status as JobOrderStatus) || "Active",
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
        jo.id.toLowerCase().includes(qLower) ||
        (jo.otherItems && jo.otherItems.some((i) => i.label.toLowerCase().includes(qLower))),
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
  if (input.cnf !== undefined) payload.cnf = Number(input.cnf) || 0;
  if (input.cf !== undefined) payload.cf = Number(input.cf) || 0;
  if (input.cn !== undefined) {
    payload.cn = Number(input.cn) || 0;
    payload.c = Number(input.cn) || 0;
  }
  if (input.otherItems !== undefined) {
    payload.otherItems = sanitizeOtherItems(input.otherItems);
  }
  if (input.status !== undefined) payload.status = input.status;

  await updateDoc(docRef, payload);
}
