import {
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import {
  canEditProduction,
  createProductionTemplate,
  recalculateSummary,
  validateDepartment,
  validateProcess,
  validateProductionValue,
  validateTimeSlot,
} from "@/engine/productionEngine";
import { DEPARTMENTS, DepartmentName } from "@/constants/departments";
import { PROCESSES_BY_DEPARTMENT } from "@/constants/processes";
import type { TimeSlot } from "@/constants/timeSlots";
import type {
  ProductionDayDocument,
  ProductionSummary,
  UpdateProductionValueParams,
} from "@/types/production";
import { formatTimestamp, getProductionDocRef } from "@/utils";

/**
 * Checks if a production document for a given day exists in Firestore.
 */
export async function productionDocumentExists(
  jobOrderId: string,
  dateStr: string,
): Promise<boolean> {
  const docRef = getProductionDocRef(jobOrderId, dateStr);
  const snap = await getDoc(docRef);
  return snap.exists();
}

/**
 * Creates a new daily production document using Production Engine template & metadata.
 */
export async function createProductionDay(
  jobOrderId: string,
  dateStr: string,
  operatorName: string = "System Operator",
): Promise<ProductionDayDocument> {
  const docRef = getProductionDocRef(jobOrderId, dateStr);
  const template = createProductionTemplate();
  const initialSummary = recalculateSummary(template);

  const payload = {
    date: dateStr,
    jobOrderId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastUpdatedBy: operatorName,
    isCompleted: false,
    isLocked: false,
    summary: initialSummary,
    ...template,
  };

  await setDoc(docRef, payload);

  return {
    id: dateStr,
    date: dateStr,
    jobOrderId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: operatorName,
    isCompleted: false,
    isLocked: false,
    summary: initialSummary,
    ...template,
  };
}

/**
 * Fetches a single production day document from Firestore.
 */
export async function getProductionDay(
  jobOrderId: string,
  dateStr: string,
): Promise<ProductionDayDocument | null> {
  const docRef = getProductionDocRef(jobOrderId, dateStr);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const raw = snap.data();
  return {
    ...raw,
    id: snap.id,
    date: raw.date || snap.id,
    jobOrderId: raw.jobOrderId || jobOrderId,
    createdAt: formatTimestamp(raw.createdAt),
    updatedAt: formatTimestamp(raw.updatedAt),
    lastUpdatedBy: raw.lastUpdatedBy || "System Operator",
    isCompleted: Boolean(raw.isCompleted),
    isLocked: Boolean(raw.isLocked),
    summary: (raw.summary as ProductionSummary) || { totalGood: 0, completionPercent: 0 },
  } as ProductionDayDocument;
}

/**
 * Lazy Creation: Fetches today's production document if it exists, or creates it automatically.
 */
export async function getOrCreateProductionDay(
  jobOrderId: string,
  dateStr: string,
  operatorName: string = "System Operator",
): Promise<ProductionDayDocument> {
  const existing = await getProductionDay(jobOrderId, dateStr);
  if (existing) return existing;
  return await createProductionDay(jobOrderId, dateStr, operatorName);
}

/**
 * Aggregates step totals for a Job Order across production documents in Firestore.
 * Supports filtering by specific dateStr and/or specific timeSlot.
 * Returns step totals mapped to step keys like "CTC1::Sorting/Cleaning Valve", "Cosmetics::Good".
 */
export async function getJobOrderProductionStepTotals(
  jobOrderId: string,
  options?: {
    dateStr?: string;
    timeSlot?: string;
  },
): Promise<Record<string, number>> {
  const totals: Record<string, number> = {};

  // Initialize all flat step keys to 0
  DEPARTMENTS.forEach((dept) => {
    PROCESSES_BY_DEPARTMENT[dept].forEach((proc) => {
      let legacyKey = proc;
      if (dept === "CTC1" && proc === "Sorting") legacyKey = "Sorting/Cleaning Valve";
      if (dept === "Cosmetics" && proc === "Tacking / Weighing") legacyKey = "Tacking/Weighing";
      if (dept === "Cosmetics" && proc === "TW / Warning / RQ") legacyKey = "TW/Warning/RQ";

      const key = `${dept}::${legacyKey}`;
      totals[key] = 0;
    });
  });

  let docsData: Array<Record<string, unknown>> = [];

  if (options?.dateStr && options.dateStr !== "All") {
    const docSnap = await getDoc(getProductionDocRef(jobOrderId, options.dateStr));
    if (docSnap.exists()) {
      docsData = [docSnap.data()];
    }
  } else {
    const colRef = collection(db, "jobOrders", jobOrderId, "production");
    const snap = await getDocs(colRef);
    docsData = snap.docs.map((d) => d.data());
  }

  docsData.forEach((data) => {
    DEPARTMENTS.forEach((dept) => {
      const deptMatrix = data[dept] as Record<string, Record<string, number>> | undefined;
      if (deptMatrix) {
        Object.keys(deptMatrix).forEach((proc) => {
          let legacyKey = proc;
          if (dept === "CTC1" && proc === "Sorting") legacyKey = "Sorting/Cleaning Valve";
          if (dept === "Cosmetics" && proc === "Tacking / Weighing") legacyKey = "Tacking/Weighing";
          if (dept === "Cosmetics" && proc === "TW / Warning / RQ") legacyKey = "TW/Warning/RQ";

          const key = `${dept}::${legacyKey}`;
          const slots = deptMatrix[proc];
          if (slots) {
            if (options?.timeSlot && options.timeSlot !== "All") {
              const val = slots[options.timeSlot];
              if (typeof val === "number" && !isNaN(val)) {
                totals[key] = (totals[key] || 0) + val;
              }
            } else {
              Object.values(slots).forEach((val) => {
                if (typeof val === "number" && !isNaN(val)) {
                  totals[key] = (totals[key] || 0) + val;
                }
              });
            }
          }
        });
      }
    });
  });

  return totals;
}

/**
 * Updates a single time slot value using Firestore dot-notation paths.
 * Validates inputs and updates summary metrics via Production Engine.
 */
export async function updateProductionValue(
  params: UpdateProductionValueParams,
): Promise<void> {
  const { jobOrderId, dateStr, department, processName, timeSlot, value, operatorName = "System Operator" } = params;

  // 1. Delegate validation to Production Engine
  validateDepartment(department);
  validateProcess(department, processName);
  validateTimeSlot(timeSlot);
  validateProductionValue(value);

  // 2. Ensure document exists lazily
  const currentDoc = await getOrCreateProductionDay(jobOrderId, dateStr, operatorName);

  // 3. Check editability business rule
  if (!canEditProduction(currentDoc)) {
    throw new Error(`Production day document for date ${dateStr} is locked or completed.`);
  }

  // 4. Calculate updated summary via Engine
  const updatedMatrix = { ...currentDoc };
  const deptObj = { ...updatedMatrix[department as DepartmentName] };
  const procObj = { ...deptObj[processName], [timeSlot]: value };
  deptObj[processName] = procObj;
  updatedMatrix[department as DepartmentName] = deptObj;

  const updatedSummary = recalculateSummary(
    updatedMatrix,
    department as DepartmentName,
    processName,
    timeSlot as TimeSlot,
    new Date().toISOString(),
  );

  const docRef = getProductionDocRef(jobOrderId, dateStr);

  await updateDoc(docRef, {
    [department]: deptObj,
    updatedAt: serverTimestamp(),
    lastUpdatedBy: operatorName,
    summary: updatedSummary,
  });
}
