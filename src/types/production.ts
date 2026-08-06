import type { Timestamp } from "firebase/firestore";
import type { DepartmentName } from "@/constants/departments";
import type { TimeSlot } from "@/constants/timeSlots";

export type { DepartmentName } from "@/constants/departments";
export type { TimeSlot } from "@/constants/timeSlots";
export { TIME_SLOTS } from "@/constants/timeSlots";
export { PROCESSES_BY_DEPARTMENT as PRODUCTION_DEPARTMENTS } from "@/constants/processes";

export type ProcessSlotValues = Record<TimeSlot, number>;

export type DepartmentProcessesMatrix = Record<string, ProcessSlotValues>;

export type FullProductionMatrix = Record<DepartmentName, DepartmentProcessesMatrix>;

export interface ProductionSummary {
  totalGood: number;
  completionPercent: number; // 0 to 100
  lastDepartment?: DepartmentName;
  lastProcess?: string;
  lastTimeSlot?: TimeSlot;
  lastUpdated?: Timestamp | string;
}

export interface ProductionDayDocument extends FullProductionMatrix {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  jobOrderId: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  lastUpdatedBy: string;
  isCompleted: boolean;
  isLocked: boolean;
  summary: ProductionSummary;
}

export interface UpdateProductionValueParams {
  jobOrderId: string;
  dateStr: string; // YYYY-MM-DD
  department: DepartmentName;
  processName: string;
  timeSlot: TimeSlot;
  value: number;
  operatorName?: string;
}
