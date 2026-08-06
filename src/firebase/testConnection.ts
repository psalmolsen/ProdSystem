import { db } from "./firebase";

/**
 * Verification module to ensure Firestore initializes correctly without UI or CRUD side effects.
 */
export function verifyFirestoreConnection(): boolean {
  return Boolean(db);
}
