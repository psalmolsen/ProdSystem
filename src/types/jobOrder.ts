import type { Timestamp } from "firebase/firestore";
import type { JobOrderStatus } from "@/constants/statuses";

export type { JobOrderStatus } from "@/constants/statuses";

export interface JobOrder {
  id: string;
  workOrder: string;
  brand: string;
  status: JobOrderStatus;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface CreateJobOrderInput {
  workOrder: string;
  brand: string;
  status?: JobOrderStatus;
}

export interface UpdateJobOrderInput {
  workOrder?: string;
  brand?: string;
  status?: JobOrderStatus;
}
