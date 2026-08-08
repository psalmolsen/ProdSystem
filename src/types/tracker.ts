import type { TimeSlot } from "@/config/stations";

export type StationId = "CTC1" | "CTC2" | "Hotworks" | "Painting" | "Cosmetics" | "Others";

export interface StationConfig {
  id: StationId;
  label: string;          // Human-readable department name
  direction: "ltr" | "rtl";
  subProcesses: string[];
}

export interface JobOrder {
  id: string;
  workOrderNumber: string;
  brandName: string;
  createdAt: string;
}

export interface Entry {
  id: string;
  jobOrderId: string;
  station: StationId;
  subProcess: string;
  personnelName: string;
  good: number;
  output: number;         // Total processed
  timeSlot: TimeSlot;     // Which 2-hour shift window this was logged in
  entryDate: string;      // ISO date string (YYYY-MM-DD)
  loggedAt: string;       // Full ISO timestamp
}

export interface CreateEntryInput {
  jobOrderId: string;
  station: StationId;
  subProcess: string;
  personnelName: string;
  good: number;
  output: number;         // Total processed
  timeSlot: TimeSlot;
  entryDate: string;      // YYYY-MM-DD
}

export interface Bottleneck {
  station: StationId;
  subProcess: string;
  key: string;
  total: number;
}
