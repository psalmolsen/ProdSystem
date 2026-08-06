import { Timestamp } from "firebase/firestore";

/**
 * Returns today's date formatted as YYYY-MM-DD.
 */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Safely parses a Firestore Timestamp, string, or Date into an ISO string.
 */
export function formatTimestamp(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === "string" && val.trim().length > 0) {
    return val;
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  return new Date().toISOString();
}

/**
 * Validates whether a string is a valid YYYY-MM-DD date.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}
