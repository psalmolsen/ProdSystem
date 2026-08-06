import type { DepartmentName } from "@/constants/departments";
import type { TimeSlot } from "@/constants/timeSlots";
import type { FullProductionMatrix } from "@/types/production";

/**
 * Deep clones a production matrix structure.
 */
export function cloneProductionMatrix(matrix: FullProductionMatrix): FullProductionMatrix {
  return JSON.parse(JSON.stringify(matrix));
}

/**
 * Safely extracts a numeric value from a production matrix given department, process, and time slot.
 */
export function getMatrixValue(
  matrix: FullProductionMatrix,
  department: DepartmentName,
  processName: string,
  timeSlot: TimeSlot,
): number {
  const deptObj = matrix[department];
  if (!deptObj) return 0;
  const procObj = deptObj[processName];
  if (!procObj) return 0;
  const val = procObj[timeSlot];
  return typeof val === "number" && !isNaN(val) ? val : 0;
}
