import type { DepartmentName } from "./departments";

export const PROCESSES_BY_DEPARTMENT: Record<DepartmentName, readonly string[]> = {
  CTC1: ["Sorting", "Devalving", "Valve Test", "Shotblasting"],
  CTC2: ["Hydro Test", "Soap Suds Test", "Revalve", "Leak Test"],
  Hotworks: [
    "Plasma Cutting",
    "Nameplate Cutting",
    "Grinding",
    "Cleaning",
    "Nameplate Welding",
    "Tack Weld CF",
    "Full Weld",
  ],
  Painting: ["Primer", "Putty", "Sanding", "Top Coat"],
  Cosmetics: [
    "Tacking / Weighing",
    "Brand Label",
    "TW / Warning / RQ",
    "Final QC",
    "Good",
    "Buffer",
    "Reject",
  ],
} as const;
