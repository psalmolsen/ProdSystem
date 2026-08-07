import type { Timestamp } from "firebase/firestore";

export type BackjobStatus = "Pending" | "In Progress" | "Resolved" | "Completed";

export interface Backjob {
  id: string;
  joNumber: string;
  brand: string;
  reworksToPerform: string;
  qty: number;
  reason?: string;
  status: BackjobStatus;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface CreateBackjobInput {
  backjobNumber?: string;
  joNumber: string;
  brand: string;
  reworksToPerform: string;
  qty: number | string;
  reason?: string;
  status?: BackjobStatus;
}

export interface UpdateBackjobInput {
  joNumber?: string;
  brand?: string;
  reworksToPerform?: string;
  qty?: number | string;
  reason?: string;
  status?: BackjobStatus;
}
