import { doc, DocumentSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { formatTimestamp } from "./date";

/**
 * Returns a typed document reference for a Job Order.
 * Path: jobOrders/{jobOrderId}
 */
export function getJobOrderDocRef(jobOrderId: string) {
  return doc(db, "jobOrders", jobOrderId);
}

/**
 * Returns a typed document reference for a daily production document.
 * Path: jobOrders/{jobOrderId}/production/{dateStr}
 */
export function getProductionDocRef(jobOrderId: string, dateStr: string) {
  return doc(db, "jobOrders", jobOrderId, "production", dateStr);
}

/**
 * Generates a unique Job Order ID string.
 */
export function generateJobOrderId(): string {
  return `JO-${Date.now().toString().slice(-6)}`;
}

/**
 * Generates a unique Access Request ID string (e.g. REQ-918948).
 */
export function generateAccessRequestId(): string {
  return `REQ-${Date.now().toString().slice(-6)}`;
}

/**
 * Formats a custom document ID directly from the user's Display Name (e.g. "Psalm Olsen Naval", "Virginia").
 */
export function formatDocIdFromDisplayName(displayName?: string | null, fallbackUid?: string): string {
  if (displayName && displayName.trim()) {
    return displayName.trim().replace(/[\/\#\?\[\]]/g, "_");
  }
  return fallbackUid ? fallbackUid.trim() : `USER-${Date.now().toString().slice(-6)}`;
}

/**
 * Normalizes document snapshot fields with formatted timestamps.
 */
export function parseDocSnapshot<T>(snap: DocumentSnapshot): T | null {
  if (!snap.exists()) return null;
  const raw = snap.data() || {};
  return {
    ...raw,
    id: snap.id,
    createdAt: formatTimestamp(raw.createdAt),
    updatedAt: formatTimestamp(raw.updatedAt),
  } as T;
}
