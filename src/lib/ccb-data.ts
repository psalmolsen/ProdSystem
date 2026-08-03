export type StageKey =
  | "receiving"
  | "inspection"
  | "requalification"
  | "leak-testing"
  | "painting"
  | "valve-installation"
  | "final-inspection"
  | "ready-for-dispatch"
  | "delivered";

export const STAGES: { key: StageKey; label: string; count: number; pending: number; completed: number }[] = [
  { key: "receiving", label: "Receiving", count: 184, pending: 42, completed: 142 },
  { key: "inspection", label: "Inspection", count: 156, pending: 61, completed: 95 },
  { key: "requalification", label: "Requalification", count: 132, pending: 38, completed: 94 },
  { key: "leak-testing", label: "Leak Test", count: 98, pending: 21, completed: 77 },
  { key: "painting", label: "Painting", count: 121, pending: 44, completed: 77 },
  { key: "valve-installation", label: "Valve Installation", count: 87, pending: 19, completed: 68 },
  { key: "final-inspection", label: "Final Inspection", count: 74, pending: 12, completed: 62 },
  { key: "ready-for-dispatch", label: "Ready for Dispatch", count: 210, pending: 0, completed: 210 },
  { key: "delivered", label: "Delivered", count: 512, pending: 0, completed: 512 },
];

export type StatusKey =
  | "receiving"
  | "inspection"
  | "processing"
  | "completed"
  | "delivered"
  | "pending"
  | "rejected"
  | "rework"
  | "inactive";

export const STATUS_LABEL: Record<StatusKey, string> = {
  receiving: "Receiving",
  inspection: "Inspection",
  processing: "Processing",
  completed: "Completed",
  delivered: "Delivered",
  pending: "Pending",
  rejected: "Rejected",
  rework: "Rework",
  inactive: "Inactive",
};

export interface Cylinder {
  id: string;
  serial: string;
  barcode: string;
  customer: string;
  brand: string;
  size: string;
  stage: string;
  location: string;
  operator: string;
  updated: string;
  status: StatusKey;
  inspection: "Pass" | "Fail" | "Pending";
  batch: string;
}

const customers = [
  "Petron Gasul",
  "Solane Energy",
  "Isla LPG",
  "Phoenix Petroleum",
  "Total Gaz",
  "Regasco Depot",
];
const brands = ["Gasul", "Solane", "Islagas", "Phoenix", "Totalgaz", "Regasco"];
const sizes = ["11 kg", "22 kg", "50 kg", "2.7 kg"];
const operators = [
  "R. Villanueva",
  "M. Santos",
  "J. Dela Cruz",
  "A. Reyes",
  "K. Bautista",
  "P. Ocampo",
];
const locations = [
  "Bay A-01",
  "Bay A-04",
  "Line 2 \u00b7 Station 3",
  "Line 1 \u00b7 Station 5",
  "Paint Booth 2",
  "Valve Bench 4",
  "Dispatch Yard",
  "Quarantine",
];
const statuses: StatusKey[] = [
  "receiving",
  "inspection",
  "processing",
  "completed",
  "delivered",
  "pending",
  "rejected",
  "rework",
];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

export const CYLINDERS: Cylinder[] = Array.from({ length: 48 }, (_, i) => {
  const stage = STAGES[i % STAGES.length];
  const status = pick(statuses, i * 3 + 1);
  return {
    id: `cyl-${i + 1}`,
    serial: `CCB-${(24010 + i * 7).toString()}`,
    barcode: `8${(4820000 + i * 137).toString()}`,
    customer: pick(customers, i),
    brand: pick(brands, i + 2),
    size: pick(sizes, i + 1),
    stage: stage.label,
    location: pick(locations, i + 3),
    operator: pick(operators, i + 4),
    updated: `${((i % 11) + 1) * 4} min ago`,
    status,
    inspection: status === "rejected" ? "Fail" : status === "pending" ? "Pending" : "Pass",
    batch: `BATCH-${2400 + (i % 6)}`,
  };
});

export const TIMELINE = [
  { stage: "Received at plant", detail: "Gate 2 \u00b7 Truck TRK-118", operator: "R. Villanueva", time: "08:12" },
  { stage: "Visual inspection", detail: "No external corrosion detected", operator: "M. Santos", time: "09:04" },
  { stage: "Requalification", detail: "Hydrostatic test 31 bar \u00b7 Pass", operator: "J. Dela Cruz", time: "10:22" },
  { stage: "Leak test", detail: "Immersion test \u00b7 No leak", operator: "A. Reyes", time: "11:47" },
  { stage: "Painting", detail: "Booth 2 \u00b7 Brand livery applied", operator: "K. Bautista", time: "13:15" },
  { stage: "Valve installation", detail: "Valve VLV-3391 torqued to spec", operator: "P. Ocampo", time: "14:38" },
];

export const THROUGHPUT = [
  { day: "Mon", processed: 268, delivered: 214 },
  { day: "Tue", processed: 312, delivered: 265 },
  { day: "Wed", processed: 289, delivered: 241 },
  { day: "Thu", processed: 341, delivered: 288 },
  { day: "Fri", processed: 376, delivered: 322 },
  { day: "Sat", processed: 198, delivered: 176 },
];

