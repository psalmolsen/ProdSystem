import type {
  Bottleneck,
  CreateEntryInput,
  Entry,
  JobOrder,
  StationId,
} from "@/types/tracker";
import { FLAT_STEPS, STATIONS, stepKey } from "@/config/stations";
import {
  fetchEntriesFromSheet,
  fetchJobOrdersFromSheet,
  isApiConfigured,
  saveEntryToSheet,
  saveJobOrderToSheet,
} from "./api/gsheetService";

// ─── Storage keys — bump version to avoid stale-shape collisions ─────────────
const KEY_JOB_ORDERS = "prodsystem.jobOrders.v4";
const KEY_ENTRIES    = "prodsystem.entries.v4";
const KEY_SEEDED     = "prodsystem.seeded.v4";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — keep app functional in-memory
  }
}

let uidCounter = 0;
const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${(uidCounter++).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

// ─── Today as YYYY-MM-DD ─────────────────────────────────────────────────────
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Google Sheets Synchronization ───────────────────────────────────────────
export async function syncFromGoogleSheets(): Promise<{
  jobOrders: JobOrder[];
  entries: Entry[];
}> {
  if (!isApiConfigured()) {
    return { jobOrders: listJobOrders(), entries: read<Entry[]>(KEY_ENTRIES, []) };
  }

  try {
    const [remoteJobOrders, remoteEntries] = await Promise.all([
      fetchJobOrdersFromSheet(),
      fetchEntriesFromSheet(),
    ]);

    if (remoteJobOrders.length > 0) {
      write(KEY_JOB_ORDERS, remoteJobOrders);
    }
    if (remoteEntries.length > 0) {
      write(KEY_ENTRIES, remoteEntries);
    }

    return {
      jobOrders: listJobOrders(),
      entries: read<Entry[]>(KEY_ENTRIES, []),
    };
  } catch (err) {
    console.warn("Failed to sync from Google Sheets, using local cache:", err);
    return { jobOrders: listJobOrders(), entries: read<Entry[]>(KEY_ENTRIES, []) };
  }
}

// ─── Job Orders ──────────────────────────────────────────────────────────────
export function createJobOrder(workOrderNumber: string, brandName: string = "Standard"): JobOrder {
  const order: JobOrder = {
    id: uid("jo"),
    workOrderNumber: workOrderNumber.trim(),
    brandName: (brandName || "Standard").trim(),
    createdAt: new Date().toISOString(),
  };
  write(KEY_JOB_ORDERS, [order, ...listJobOrders()]);

  // Async sync to Google Sheets if configured
  if (isApiConfigured()) {
    saveJobOrderToSheet(order).catch((err) =>
      console.warn("Failed to post job order to Google Sheets:", err),
    );
  }

  return order;
}

export function listJobOrders(): JobOrder[] {
  return read<JobOrder[]>(KEY_JOB_ORDERS, []);
}

// ─── Entries ─────────────────────────────────────────────────────────────────
export function createEntry(input: CreateEntryInput): Entry {
  const entry: Entry = {
    id: uid("e"),
    jobOrderId: input.jobOrderId,
    station: input.station,
    subProcess: input.subProcess,
    personnelName: input.personnelName.trim(),
    good: Math.max(0, Math.round(input.good ?? input.output)),
    output: Math.max(0, Math.round(input.output)),
    timeSlot: input.timeSlot,
    entryDate: input.entryDate,
    loggedAt: new Date().toISOString(),
  };
  write(KEY_ENTRIES, [entry, ...read<Entry[]>(KEY_ENTRIES, [])]);

  // Async sync to Google Sheets if configured
  if (isApiConfigured()) {
    saveEntryToSheet(entry).catch((err) =>
      console.warn("Failed to post entry to Google Sheets:", err),
    );
  }

  return entry;
}

export function getEntriesForJobOrder(jobOrderId: string): Entry[] {
  return read<Entry[]>(KEY_ENTRIES, []).filter((e) => e.jobOrderId === jobOrderId);
}

export function getSubProcessEntries(
  jobOrderId: string,
  station: StationId,
  subProcess: string,
): Entry[] {
  return getEntriesForJobOrder(jobOrderId).filter(
    (e) => e.station === station && e.subProcess === subProcess,
  );
}

export function getTotalForSubProcess(
  jobOrderId: string,
  station: StationId,
  subProcess: string,
): number {
  return getSubProcessEntries(jobOrderId, station, subProcess).reduce(
    (sum, e) => sum + e.output,
    0,
  );
}

export function getTotalsByStep(jobOrderId: string): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const step of FLAT_STEPS) totals[step.key] = 0;
  for (const entry of getEntriesForJobOrder(jobOrderId)) {
    totals[stepKey(entry.station, entry.subProcess)] += entry.output;
  }
  return totals;
}

export function getGoodTotalsByStep(jobOrderId: string): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const step of FLAT_STEPS) totals[step.key] = 0;
  for (const entry of getEntriesForJobOrder(jobOrderId)) {
    totals[stepKey(entry.station, entry.subProcess)] += entry.good ?? entry.output;
  }
  return totals;
}

export function getBottleneckSubProcess(jobOrderId: string): Bottleneck | null {
  const totals = getTotalsByStep(jobOrderId);
  let best: Bottleneck | null = null;
  for (const step of FLAT_STEPS) {
    const total = totals[step.key];
    if (total > 0 && (best === null || total > best.total)) {
      best = {
        station: step.station,
        subProcess: step.subProcess,
        key: step.key,
        total,
      };
    }
  }
  return best;
}

export function getRecentPersonnel(
  jobOrderId: string,
  station: StationId,
  subProcess: string,
): string[] {
  const names: string[] = [];
  for (const entry of getSubProcessEntries(jobOrderId, station, subProcess)) {
    if (entry.personnelName && !names.includes(entry.personnelName)) {
      names.push(entry.personnelName);
    }
  }
  return names;
}

export function getJobOrderTotal(jobOrderId: string): number {
  return getEntriesForJobOrder(jobOrderId).reduce((sum, e) => sum + e.output, 0);
}

export function getTodayTotal(jobOrderId: string): number {
  const today = todayIso();
  return getEntriesForJobOrder(jobOrderId)
    .filter((e) => (e.entryDate ?? e.loggedAt.slice(0, 10)) === today)
    .reduce((sum, e) => sum + e.output, 0);
}

// ─── Totals by date × time-slot (for the daily grid view) ───────────────────
export function getTotalsByDateAndSlot(
  jobOrderId: string,
  station: StationId,
  subProcess: string,
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const entry of getSubProcessEntries(jobOrderId, station, subProcess)) {
    const date = entry.entryDate ?? entry.loggedAt.slice(0, 10);
    if (!result[date]) result[date] = {};
    result[date][entry.timeSlot] = (result[date][entry.timeSlot] ?? 0) + entry.output;
  }
  return result;
}

// ─── Seed data ───────────────────────────────────────────────────────────────
const SEED_PERSONNEL: Record<StationId, string[]> = {
  CTC1:      ["J. Dela Cruz", "M. Santos",    "R. Villanueva"],
  CTC2:      ["P. Ocampo",    "C. Torres",    "N. Garcia"],
  Hotworks:  ["A. Reyes",     "K. Bautista",  "L. Mendoza"],
  Painting:  ["E. Ramos",     "S. Fernandez", "T. Aquino"],
  Cosmetics: ["B. Cruz",      "D. Lim",       "F. Manalo"],
};

const SEED_SLOTS = ["6am–8am", "8am–10am", "11am–1pm", "1pm–3pm", "3pm–5pm"] as const;

interface SeedPlan {
  workOrderNumber: string;
  brandName: string;
  totals: Record<string, number>;
}

const SEED_PLANS: SeedPlan[] = [
  {
    workOrderNumber: "WO-2408",
    brandName: "FireMaster",
    totals: {
      "CTC1::Sorting/Cleaning Valve": 70,
      "CTC1::Devalving":              64,
      "CTC1::Shotblasting":           22,
      "Painting::Primer":             12,
    },
  },
  {
    workOrderNumber: "WO-2409",
    brandName: "Oxigeno",
    totals: {
      "CTC1::Sorting/Cleaning Valve": 120,
      "CTC1::Devalving":              108,
      "CTC1::Shotblasting":            44,
      "Hotworks::Plasma Cutting":      60,
      "Hotworks::Grinding":            96,
      "Hotworks::Full Weld":           72,
      "CTC2::Hydro Test":              40,
      "Painting::Primer":              30,
    },
  },
  {
    workOrderNumber: "WO-2410",
    brandName: "SafeAir",
    totals: {
      "CTC1::Sorting/Cleaning Valve": 130,
      "CTC1::Devalving":              124,
      "CTC1::Valve Test":              96,
      "CTC1::Shotblasting":            72,
      "Hotworks::Plasma Cutting":      96,
      "Hotworks::Nameplate Cutting":   42,
      "Hotworks::Grinding":           150,
      "Hotworks::Cleaning":           132,
      "Hotworks::Nameplate Welding":   90,
      "Hotworks::Tack Weld CF":        84,
      "Hotworks::Full Weld":          118,
      "CTC2::Hydro Test":              94,
      "CTC2::Soap Suds Test":          82,
      "CTC2::Revalve":                 76,
      "CTC2::Leak Test":               68,
      "Painting::Primer":              74,
      "Painting::Putty":               44,
      "Painting::Sanding":             58,
      "Painting::Top Coat":            40,
      "Cosmetics::Tacking/Weighing":   36,
      "Cosmetics::Brand Label":        32,
      "Cosmetics::TW/Warning/RQ":      28,
      "Cosmetics::Final QC":           26,
      "Cosmetics::Good":               24,
    },
  },
];

function seedEntries(order: JobOrder, plan: SeedPlan): void {
  const entries: Entry[] = [];
  let i = 0;
  const today = todayIso();
  for (const station of STATIONS) {
    const pool = SEED_PERSONNEL[station.id];
    for (const subProcess of station.subProcesses) {
      const total = plan.totals[stepKey(station.id, subProcess)] ?? 0;
      if (total <= 0) continue;
      const split = Math.max(2, Math.min(5, Math.round(total / 26)));
      let remaining = total;
      for (let k = 0; k < split; k++) {
        const out =
          k === split - 1
            ? remaining
            : Math.max(1, Math.round(remaining / (split - k)));
        remaining -= out;
        const slotIndex = (i * 3 + k) % SEED_SLOTS.length;
        const minutesAgo = ((i * 173) % (5 * 24 * 60)) + (i % 7) * 60;
        entries.push({
          id: uid("e"),
          jobOrderId: order.id,
          station: station.id,
          subProcess,
          personnelName: pool[i % pool.length],
          good: out,
          output: out,
          timeSlot: SEED_SLOTS[slotIndex],
          entryDate: today,
          loggedAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
        });
        i++;
      }
    }
  }
  write(KEY_ENTRIES, [...entries, ...read<Entry[]>(KEY_ENTRIES, [])]);
}

export function ensureSeed(): void {
  if (read<boolean>(KEY_SEEDED, false)) return;
  if (listJobOrders().length > 0) {
    write(KEY_SEEDED, true);
    return;
  }
  for (const plan of SEED_PLANS) {
    seedEntries(createJobOrder(plan.workOrderNumber, plan.brandName), plan);
  }
  write(KEY_SEEDED, true);
}
