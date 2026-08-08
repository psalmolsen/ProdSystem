import type { Timestamp } from "firebase/firestore";

export type JobOrderStatus = "Active" | "Pending" | "Completed" | "Cancelled";
export type CylinderVariant = "11 kg" | "22 kg" | "50 kg";

export interface VariantBreakdown {
  cnf?: number | string;
  cf?: number | string;
  cn?: number | string;
}

export interface JobOrderVariants {
  size11kg?: VariantBreakdown;
  size22kg?: VariantBreakdown;
  size50kg?: VariantBreakdown;
}

export interface OtherWorkOrderItem {
  label: string;
  qty: number | string;
}

export interface JobOrder {
  id: string;
  workOrder: string;
  brand: string;
  cylinderSize?: CylinderVariant;
  size11kg?: number | string;
  size22kg?: number | string;
  size50kg?: number | string;
  variants?: JobOrderVariants;
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
  brand?: string;
  cylinderSize?: CylinderVariant;
  size11kg?: number | string;
  size22kg?: number | string;
  size50kg?: number | string;
  variants?: JobOrderVariants;
  cnf?: number | string;
  cf?: number | string;
  cn?: number | string;
  otherItems?: OtherWorkOrderItem[];
  status?: JobOrderStatus;
}

export interface UpdateJobOrderInput {
  workOrder?: string;
  brand?: string;
  cylinderSize?: CylinderVariant;
  size11kg?: number | string;
  size22kg?: number | string;
  size50kg?: number | string;
  variants?: JobOrderVariants;
  cnf?: number | string;
  cf?: number | string;
  cn?: number | string;
  otherItems?: OtherWorkOrderItem[];
  status?: JobOrderStatus;
}

export function getJoCapacitySummary(jo: JobOrder): string {
  const sizes: string[] = [];

  const v11 = jo.variants?.size11kg;
  const v22 = jo.variants?.size22kg;
  const v50 = jo.variants?.size50kg;

  if (v11 && (Number(v11.cnf || 0) > 0 || Number(v11.cf || 0) > 0 || Number(v11.cn || 0) > 0)) {
    sizes.push("11kg");
  } else if ((Number(jo.size11kg) || 0) > 0) {
    sizes.push("11kg");
  }

  if (v22 && (Number(v22.cnf || 0) > 0 || Number(v22.cf || 0) > 0 || Number(v22.cn || 0) > 0)) {
    sizes.push("22kg");
  } else if ((Number(jo.size22kg) || 0) > 0) {
    sizes.push("22kg");
  }

  if (v50 && (Number(v50.cnf || 0) > 0 || Number(v50.cf || 0) > 0 || Number(v50.cn || 0) > 0)) {
    sizes.push("50kg");
  } else if ((Number(jo.size50kg) || 0) > 0) {
    sizes.push("50kg");
  }

  if (sizes.length === 0) {
    sizes.push(jo.cylinderSize ? jo.cylinderSize.replace(/\s+/g, "") : "11kg");
  }

  return sizes.join(", ");
}
