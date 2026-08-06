import { DEPARTMENTS, DepartmentName } from "@/constants/departments";
import { PROCESSES_BY_DEPARTMENT } from "@/constants/processes";
import { TIME_SLOTS, TimeSlot } from "@/constants/timeSlots";
import type { FullProductionMatrix, ProductionDayDocument, ProductionSummary } from "@/types/production";

/**
 * PRODUCTION ENGINE - Manufacturing Domain Business Logic Layer
 * Encapsulates all manufacturing rules, matrix calculations, validation logic, and template creation.
 */

/**
 * Creates an empty production day matrix initialized to 0 for all departments, processes, and time slots.
 */
export function createProductionTemplate(): FullProductionMatrix {
  const matrix = {} as FullProductionMatrix;

  DEPARTMENTS.forEach((dept) => {
    const processes = PROCESSES_BY_DEPARTMENT[dept];
    const deptMatrix: Record<string, Record<TimeSlot, number>> = {};

    processes.forEach((proc) => {
      const slotValues: Record<TimeSlot, number> = {
        "6-8": 0,
        "8-10": 0,
        "11-1": 0,
        "1-3": 0,
        "3-5": 0,
      };
      deptMatrix[proc] = slotValues;
    });

    matrix[dept] = deptMatrix;
  });

  return matrix;
}

/**
 * Determines whether a production day document can be edited.
 */
export function canEditProduction(doc?: ProductionDayDocument | null): boolean {
  if (!doc) return true;
  return !doc.isCompleted && !doc.isLocked;
}

/**
 * Checks whether a production day document is locked against edits.
 */
export function isProductionLocked(doc?: ProductionDayDocument | null): boolean {
  if (!doc) return false;
  return Boolean(doc.isLocked || doc.isCompleted);
}

/**
 * Calculates total output across all processes for a single department.
 */
export function calculateDepartmentTotals(
  matrix: FullProductionMatrix,
  department: DepartmentName,
): number {
  const deptMatrix = matrix[department];
  if (!deptMatrix) return 0;

  let total = 0;
  Object.values(deptMatrix).forEach((procSlots) => {
    if (procSlots) {
      Object.values(procSlots).forEach((cnt) => {
        if (typeof cnt === "number" && !isNaN(cnt)) {
          total += cnt;
        }
      });
    }
  });

  return total;
}

/**
 * Calculates total output count across all departments in the production matrix.
 */
export function calculateOverallTotals(matrix: FullProductionMatrix): number {
  let grandTotal = 0;
  DEPARTMENTS.forEach((dept) => {
    grandTotal += calculateDepartmentTotals(matrix, dept);
  });
  return grandTotal;
}

/**
 * Calculates completion percentage against a daily target output goal (default 500 cylinders).
 */
export function calculateCompletion(
  matrix: FullProductionMatrix,
  targetGoal: number = 500,
): number {
  if (targetGoal <= 0) return 0;
  const currentTotal = calculateOverallTotals(matrix);
  return Math.min(100, Math.round((currentTotal / targetGoal) * 100));
}

/**
 * Validates quantity value.
 */
export function validateProductionValue(value: number): void {
  if (typeof value !== "number" || isNaN(value) || value < 0) {
    throw new Error(`Invalid production value: "${value}". Must be a non-negative number.`);
  }
}

/**
 * Validates time slot against configured TIME_SLOTS.
 */
export function validateTimeSlot(timeSlot: string): asserts timeSlot is TimeSlot {
  if (!TIME_SLOTS.includes(timeSlot as TimeSlot)) {
    throw new Error(`Invalid time slot: "${timeSlot}". Allowed values: ${TIME_SLOTS.join(", ")}`);
  }
}

/**
 * Validates department against configured DEPARTMENTS.
 */
export function validateDepartment(department: string): asserts department is DepartmentName {
  if (!DEPARTMENTS.includes(department as DepartmentName)) {
    throw new Error(`Invalid department: "${department}". Allowed values: ${DEPARTMENTS.join(", ")}`);
  }
}

/**
 * Validates sub-process name for a given department.
 */
export function validateProcess(department: DepartmentName, processName: string): void {
  const allowedProcesses = PROCESSES_BY_DEPARTMENT[department];
  if (!allowedProcesses.includes(processName)) {
    throw new Error(`Invalid process "${processName}" for department "${department}".`);
  }
}

/**
 * Business decision function: determines if a production document should be created.
 */
export function shouldCreateProductionDay(exists: boolean): boolean {
  return !exists;
}

/**
 * Recalculates and updates the summary object for a production document.
 * Omits undefined fields so Firestore setDoc / updateDoc calls succeed cleanly.
 */
export function recalculateSummary(
  matrix: FullProductionMatrix,
  lastDept?: DepartmentName,
  lastProc?: string,
  lastSlot?: TimeSlot,
  lastUpdated?: string,
  targetGoal: number = 500,
): ProductionSummary {
  const totalGood = calculateOverallTotals(matrix);
  const completionPercent = calculateCompletion(matrix, targetGoal);

  const summary: ProductionSummary = {
    totalGood,
    completionPercent,
    lastUpdated: lastUpdated || new Date().toISOString(),
  };

  if (lastDept !== undefined) summary.lastDepartment = lastDept;
  if (lastProc !== undefined) summary.lastProcess = lastProc;
  if (lastSlot !== undefined) summary.lastTimeSlot = lastSlot;

  return summary;
}
