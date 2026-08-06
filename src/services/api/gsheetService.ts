import type { Entry, JobOrder } from "@/types/tracker";
import { apiGet, apiPost, isApiConfigured } from "./client";

export { isApiConfigured };

interface RawJobOrderRow {
  id?: string;
  workOrderNumber?: string;
  work_order_number?: string;
  brandName?: string;
  brand_name?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

interface RawEntryRow {
  id?: string;
  jobOrderId?: string;
  job_order_id?: string;
  station?: string;
  subProcess?: string;
  sub_process?: string;
  personnelName?: string;
  personnel_name?: string;
  good?: number | string;
  output?: number | string;
  timeSlot?: string;
  time_slot?: string;
  entryDate?: string;
  entry_date?: string;
  loggedAt?: string;
  logged_at?: string;
}

export async function fetchJobOrdersFromSheet(): Promise<JobOrder[]> {
  const rows = await apiGet<RawJobOrderRow[]>("getJobOrders");
  return rows.map((r) => ({
    id: String(r.id || ""),
    workOrderNumber: String(r.workOrderNumber || r.work_order_number || ""),
    brandName: String(r.brandName || r.brand_name || ""),
    createdAt: String(r.createdAt || r.created_at || new Date().toISOString()),
  }));
}

export async function fetchEntriesFromSheet(jobOrderId?: string): Promise<Entry[]> {
  const params = jobOrderId ? { jobOrderId } : {};
  const rows = await apiGet<RawEntryRow[]>("getEntries", params);

  return rows.map((r) => ({
    id: String(r.id || ""),
    jobOrderId: String(r.jobOrderId || r.job_order_id || ""),
    station: (r.station as Entry["station"]) || "CTC1",
    subProcess: String(r.subProcess || r.sub_process || ""),
    personnelName: String(r.personnelName || r.personnel_name || ""),
    good: Number(r.good ?? r.output ?? 0),
    output: Number(r.output ?? 0),
    timeSlot: (r.timeSlot || r.time_slot || "6am–8am") as Entry["timeSlot"],
    entryDate: String(r.entryDate || r.entry_date || ""),
    loggedAt: String(r.loggedAt || r.logged_at || new Date().toISOString()),
  }));
}

export async function saveJobOrderToSheet(order: JobOrder): Promise<JobOrder> {
  return await apiPost<JobOrder>("createJobOrder", order);
}

export async function saveEntryToSheet(entry: Entry): Promise<Entry> {
  return await apiPost<Entry>("createEntry", entry);
}
