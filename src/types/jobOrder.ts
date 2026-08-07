import type { Timestamp } from "firebase/firestore";
import type { JobOrderStatus } from "@/constants/statuses";

export type { JobOrderStatus } from "@/constants/statuses";

export interface OtherWorkOrderItem {
  label: string;
  qty: number | string;
}

export interface JobOrder {
  id: string;
  workOrder: string;
  brand: string;
  cnf?: number | string;
  cf?: number | string;
  cn?: number | string;
  c?: number | string;
  otherItems?: OtherWorkOrderItem[];
  status: JobOrderStatus;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface CreateJobOrderInput {
  joNumber?: string;
  workOrder?: string;
  brand: string;
  cnf?: number | string;
  cf?: number | string;
  cn?: number | string;
  otherItems?: OtherWorkOrderItem[];
  status?: JobOrderStatus;
}

export interface UpdateJobOrderInput {
  workOrder?: string;
  brand?: string;
  cnf?: number | string;
  cf?: number | string;
  cn?: number | string;
  otherItems?: OtherWorkOrderItem[];
  status?: JobOrderStatus;
}
