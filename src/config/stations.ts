import type { StationConfig, StationId } from "@/types/tracker";

// ─── Station / Department configuration ──────────────────────────────────────
// Matches the production spreadsheet exactly:
//   Department  │  Processes (in order)
//   ────────────┼──────────────────────────────────────────────────────────────
//   CTC 1       │  Sorting/Cleaning Valve · Devalving · Valve Test · Shotblasting
//   CTC 2       │  Hydro Test · Soap Suds Test · Revalve · Leak Test
//   Hotworks    │  Plasma Cutting · Nameplate Cutting · Grinding · Cleaning
//               │  Nameplate Welding · Tack Weld CF · Full Weld
//   Painting    │  Primer · Putty · Sanding · Top Coat
//   Cosmetics   │  Tacking/Weighing · Brand Label · TW/Warning/RQ

export const STATIONS: StationConfig[] = [
  {
    id: "CTC1",
    label: "CTC 1",
    direction: "ltr",
    subProcesses: [
      "Sorting/Cleaning Valve",
      "Devalving",
      "Valve Test",
      "Shotblasting",
    ],
  },
  {
    id: "CTC2",
    label: "CTC 2",
    direction: "ltr",
    subProcesses: [
      "Hydro Test",
      "Soap Suds Test",
      "Revalve",
      "Leak Test",
    ],
  },
  {
    id: "Hotworks",
    label: "Hotworks",
    direction: "rtl",
    subProcesses: [
      "Plasma Cutting",
      "Nameplate Cutting",
      "Grinding",
      "Cleaning",
      "Nameplate Welding",
      "Tack Weld CF",
      "Full Weld",
    ],
  },
  {
    id: "Painting",
    label: "Painting",
    direction: "rtl",
    subProcesses: ["Primer", "Putty", "Sanding", "Top Coat"],
  },
  {
    id: "Cosmetics",
    label: "Cosmetics",
    direction: "ltr",
    subProcesses: ["Tacking/Weighing", "Brand Label", "TW/Warning/RQ", "Final QC", "Good"],
  },
];

// ─── Time slots ───────────────────────────────────────────────────────────────
export const TIME_SLOTS = [
  "6am–8am",
  "8am–10am",
  "11am–1pm",
  "1pm–3pm",
  "3pm–5pm",
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const stepKey = (station: StationId, subProcess: string): string =>
  `${station}::${subProcess}`;

export interface FlatStep {
  station: StationId;
  label: string;
  subProcess: string;
  key: string;
}

export const FLAT_STEPS: FlatStep[] = STATIONS.flatMap((station) =>
  station.subProcesses.map((subProcess) => ({
    station: station.id,
    label: station.label,
    subProcess,
    key: stepKey(station.id, subProcess),
  })),
);
