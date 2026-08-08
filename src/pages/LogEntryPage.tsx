import { useState, useEffect, useMemo, useId } from "react";
import type { FormEvent } from "react";
import {
  CheckCircle2,
  Plus,
  ClipboardCheck,
  GaugeCircle,
  Wrench,
  PaintRoller,
  Droplets,
  Layers,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { PageShell, Panel } from "@/components/app/page-shell";
import { STATIONS, TIME_SLOTS } from "@/config/stations";
import type { TimeSlot as LegacyTimeSlot } from "@/config/stations";
import type { StationId } from "@/types/tracker";
import type { JobOrder } from "@/types/jobOrder";
import type { DepartmentName } from "@/constants/departments";
import type { TimeSlot } from "@/constants/timeSlots";
import { createJobOrder, getAllJobOrders } from "@/services/firestore/jobOrderService";
import { updateProductionValue } from "@/services/firestore/productionService";
import { cn } from "@/lib/utils";

// ── Dept tab config ────────────────────────────────────────────────────────────
const DEPT_TABS: {
  id: StationId;
  label: string;
  short: string;
  icon: typeof ClipboardCheck;
  color: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}[] = [
  {
    id: "CTC1",
    label: "CTC 1",
    short: "CTC1",
    icon: ClipboardCheck,
    color: "#0071E3",
    activeBg: "rgba(0,113,227,0.10)",
    activeText: "#0071E3",
    activeBorder: "#0071E3",
  },
  {
    id: "CTC2",
    label: "CTC 2",
    short: "CTC2",
    icon: GaugeCircle,
    color: "#5856D6",
    activeBg: "rgba(88,86,214,0.10)",
    activeText: "#5856D6",
    activeBorder: "#5856D6",
  },
  {
    id: "Hotworks",
    label: "Hotworks",
    short: "HW",
    icon: Wrench,
    color: "#FF9500",
    activeBg: "rgba(255,149,0,0.10)",
    activeText: "#FF9500",
    activeBorder: "#FF9500",
  },
  {
    id: "Painting",
    label: "Painting",
    short: "PNT",
    icon: PaintRoller,
    color: "#34C759",
    activeBg: "rgba(52,199,89,0.10)",
    activeText: "#34C759",
    activeBorder: "#34C759",
  },
  {
    id: "Cosmetics",
    label: "Cosmetics",
    short: "CSM",
    icon: Droplets,
    color: "#FF375F",
    activeBg: "rgba(255,55,95,0.10)",
    activeText: "#FF375F",
    activeBorder: "#FF375F",
  },
  {
    id: "Others",
    label: "Others",
    short: "OTH",
    icon: Layers,
    color: "#8E8E93",
    activeBg: "rgba(142,142,147,0.10)",
    activeText: "#8E8E93",
    activeBorder: "#8E8E93",
  },
];

// ── Mapping Helpers ────────────────────────────────────────────────────────────
function mapTimeSlotToEngine(slot: LegacyTimeSlot): TimeSlot {
  switch (slot) {
    case "6am–8am":
      return "6-8";
    case "8am–10am":
      return "8-10";
    case "11am–1pm":
      return "11-1";
    case "1pm–3pm":
      return "1-3";
    case "3pm–5pm":
      return "3-5";
    default:
      return "6-8";
  }
}

function mapSubProcessToEngine(dept: StationId, subProc: string): string {
  if (dept === "CTC1" && subProc === "Sorting/Cleaning Valve") return "Sorting";
  if (dept === "Cosmetics" && subProc === "Tacking/Weighing") return "Tacking / Weighing";
  if (dept === "Cosmetics" && subProc === "TW/Warning/RQ") return "TW / Warning / RQ";
  return subProc;
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ProcessRow {
  subProcess: string;
  output: string;
  personnel: string;
}

interface FormErrors {
  jobOrder?: string;
  date?: string;
  timeSlot?: string;
  rows?: string;
}

function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── LogEntryPage ───────────────────────────────────────────────────────────────
export function LogEntryPage() {
  const uid = useId();

  // Firestore Job Orders state
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Dept selection
  const [activeDeptId, setActiveDeptId] = useState<StationId>("CTC1");
  const activeDept = useMemo(
    () => DEPT_TABS.find((d) => d.id === activeDeptId) || DEPT_TABS[0],
    [activeDeptId],
  );

  // Header state
  const [selectedJoId, setSelectedJoId] = useState<string>("");
  const [joNumber, setJoNumber] = useState<string>("");
  const [workOrderCnf, setWorkOrderCnf] = useState<string>("");
  const [workOrderCf, setWorkOrderCf] = useState<string>("");
  const [workOrderC, setWorkOrderC] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("");
  const [date, setDate] = useState(todayValue());
  const [timeSlot, setTimeSlot] = useState<LegacyTimeSlot | "">("6am–8am");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Helper to select and populate JO details
  const selectAndConfirmJo = (jo: JobOrder) => {
    setSelectedJoId(jo.id);
    const digits = jo.workOrder.replace(/\D/g, "");
    setJoNumber(digits || jo.id);
    setBrandName(jo.brand || "");
    setWorkOrderCnf(jo.cnf ? String(jo.cnf) : "");
    setWorkOrderCf(jo.cf ? String(jo.cf) : "");
    setWorkOrderC(jo.cn ? String(jo.cn) : (jo.c ? String(jo.c) : ""));
    sessionStorage.setItem("activeMonitoringJoId", jo.id);
  };

  // Load Job Orders directly from Firestore
  const loadJobOrders = async () => {
    setLoadingOrders(true);
    try {
      const orders = await getAllJobOrders();
      setJobOrders(orders);
      
      const storedJoId = sessionStorage.getItem("activeMonitoringJoId");
      if (storedJoId) {
        const found = orders.find((o) => o.id === storedJoId);
        if (found) {
          selectAndConfirmJo(found);
          return;
        }
      }

      if (orders.length > 0) {
        selectAndConfirmJo(orders[0]);
      }
    } catch (err) {
      console.error("Failed to load Job Orders from Firestore:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadJobOrders();
  }, []);

  // Auto-clear saved banner
  useEffect(() => {
    if (!savedMessage) return;
    const t = window.setTimeout(() => setSavedMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [savedMessage]);

  const handleJoNumberChange = (numStr: string) => {
    const cleanNum = numStr.replace(/\D/g, "");
    setJoNumber(cleanNum);
    if (!cleanNum) {
      setSelectedJoId("");
      return;
    }
    const matched = jobOrders.find((o) => {
      const digits = o.workOrder.replace(/\D/g, "");
      return digits === cleanNum || o.id === `JO-${cleanNum}` || o.id === cleanNum;
    });
    if (matched) {
      selectAndConfirmJo(matched);
    } else {
      setSelectedJoId("");
    }
  };

  // Process rows per department
  const [allDeptRows, setAllDeptRows] = useState<Record<StationId, ProcessRow[]>>(() => {
    const initial: Partial<Record<StationId, ProcessRow[]>> = {};
    for (const tab of DEPT_TABS) {
      const station = STATIONS.find((s) => s.id === tab.id);
      const subProcs = tab.id === "Others" ? ["Buffer", "Reject"] : (station?.subProcesses || []);
      initial[tab.id] = subProcs.map((sp) => ({
        subProcess: sp,
        output: "",
        personnel: "",
      }));
    }
    return initial as Record<StationId, ProcessRow[]>;
  });

  const rows = allDeptRows[activeDeptId] || [];

  const isRowFilled = (r: ProcessRow) => {
    const out = Number(r.output.trim());
    return r.output.trim() !== "" && out > 0;
  };

  const totalFilledCount = useMemo(() => {
    let count = 0;
    for (const tab of DEPT_TABS) {
      const deptRows = allDeptRows[tab.id] || [];
      count += deptRows.filter(isRowFilled).length;
    }
    return count;
  }, [allDeptRows]);

  const updateRow = (
    index: number,
    field: keyof Omit<ProcessRow, "subProcess">,
    value: string,
  ) => {
    setAllDeptRows((prev) => ({
      ...prev,
      [activeDeptId]: prev[activeDeptId].map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    }));
  };

  // ── Submit to Firestore ────────────────────────────────────────────────────
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: FormErrors = {};

    let targetJoId = selectedJoId;
    if (!targetJoId && joNumber) {
      const existing = jobOrders.find(
        (o) => o.workOrder.replace(/\D/g, "") === joNumber,
      );
      if (existing) {
        targetJoId = existing.id;
      }
    }

    if (!targetJoId && !joNumber) next.jobOrder = "Enter a job order number.";
    if (!date) next.date = "Select a date.";
    if (!timeSlot) next.timeSlot = "Select a time slot.";

    // Gather filled rows across ALL departments
    let totalFilled = 0;
    const filledByDept: Record<StationId, ProcessRow[]> = {} as Record<StationId, ProcessRow[]>;

    for (const tab of DEPT_TABS) {
      const deptRows = allDeptRows[tab.id] || [];
      const filled = deptRows.filter(isRowFilled);
      filledByDept[tab.id] = filled;
      totalFilled += filled.length;
    }

    if (totalFilled === 0) {
      next.rows = "Enter at least one output count in any department.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      // 1. If Job Order does not exist in Firestore yet, create it!
      if (!targetJoId && joNumber) {
        const createdJo = await createJobOrder({
          workOrder: `WO-${joNumber}`,
          brand: brandName.trim() || "Standard",
          status: "Active",
        });
        targetJoId = createdJo.id;
        setSelectedJoId(createdJo.id);
        await loadJobOrders();
      }

      // 2. Save filled entries to Firestore under jobOrders/{joId}/production/{date}
      const engineTimeSlot = mapTimeSlotToEngine(timeSlot as LegacyTimeSlot);

      for (const tab of DEPT_TABS) {
        const filled = filledByDept[tab.id] || [];
        for (const row of filled) {
          const parsedOut = Math.max(0, Math.round(Number(row.output) || 0));
          const mappedProcess = mapSubProcessToEngine(tab.id, row.subProcess);

          await updateProductionValue({
            jobOrderId: targetJoId,
            dateStr: date,
            department: tab.id as DepartmentName,
            processName: mappedProcess,
            timeSlot: engineTimeSlot,
            value: parsedOut,
            operatorName: row.personnel.trim() || "Operator",
          });
        }
      }

      // 3. Reset output fields for all departments
      setAllDeptRows((prev) => {
        const updated = { ...prev };
        for (const station of STATIONS) {
          if (updated[station.id]) {
            updated[station.id] = updated[station.id].map((r) => ({ ...r, output: "" }));
          }
        }
        return updated;
      });

      setSavedMessage(`Saved ${totalFilled} process entries to Cloud Firestore successfully!`);
    } catch (err) {
      console.error("Failed to save entries to Firestore:", err);
      const msg = (err as Error).message;
      if (msg.includes("permission") || msg.includes("permissions")) {
        setErrors({
          rows: "Firestore Security Rules Error: Permission Denied. Please set 'allow read, write: if true;' in your Firebase Console → Firestore Database → Rules tab.",
        });
      } else {
        setErrors({ rows: `Firestore Save Error: ${msg}` });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Log Entry"
      breadcrumb={["CCB", "Production", "Log Entry"]}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {/* Saved Success Banner */}
        {savedMessage && (
          <div className="flex items-center gap-3 rounded-[12px] bg-[#DCFCE7] p-4 text-[14px] font-semibold text-[#16A34A] border border-[#BBF7D0]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{savedMessage}</span>
          </div>
        )}

        {/* ── Job details ──────────────────────────────────────────────────── */}
        <Panel title="Job Order & Shift Details">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Sub-card 1: Job Identification & Auto-loaded Info */}
            <div className="flex flex-col justify-between rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4.5">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                  Selected Job Order Details
                </p>
                <div className="space-y-3.5">
                  {/* Job Order Dropdown Choice */}
                  <div>
                    <label
                      htmlFor={`${uid}-jo-select`}
                      className="mb-1.5 block text-[12px] font-semibold text-[#1D1D1F]"
                    >
                      Select Active Job Order
                    </label>

                    {loadingOrders ? (
                      <div className="flex h-[42px] items-center gap-2 rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] px-3 text-[13px] text-[#6E6E73]">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#0071E3]" />
                        <span>Loading Job Orders...</span>
                      </div>
                    ) : (
                      <select
                        id={`${uid}-jo-select`}
                        value={selectedJoId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = jobOrders.find((o) => o.id === val);
                          if (matched) {
                            selectAndConfirmJo(matched);
                          }
                        }}
                        className={cn(
                          "h-[42px] w-full rounded-[12px] border border-[#D2D2D7] bg-white px-3 text-[14px] font-semibold text-[#1D1D1F] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 cursor-pointer",
                          errors.jobOrder && "border-[#ff3b30]",
                        )}
                      >
                        <option value="" disabled>
                          -- Select a Job Order to log data --
                        </option>
                        {jobOrders.map((jo) => (
                          <option key={jo.id} value={jo.id}>
                            {jo.id}{jo.brand && jo.brand !== "Standard" && jo.brand !== "Standard Brand" ? ` — ${jo.brand}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.jobOrder && (
                      <p className="mt-1 text-[12px] text-[#ff3b30]">{errors.jobOrder}</p>
                    )}
                  </div>

                  {/* Auto-loaded Details Badges */}
                  {selectedJoId && (
                    <div className="rounded-[12px] border border-[#D2D2D7] bg-white p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#6E6E73]">Brand Name:</span>
                        <span className="text-[13px] font-bold text-[#1D1D1F]">{brandName || "Standard"}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA] text-[12px]">
                        <span className="text-[#6E6E73]">Quantities:</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[#F5F5F7] px-2 py-0.5 text-[11px] font-semibold text-[#1D1D1F]">CNF: {workOrderCnf || 0}</span>
                          <span className="rounded bg-[#F5F5F7] px-2 py-0.5 text-[11px] font-semibold text-[#1D1D1F]">CF: {workOrderCf || 0}</span>
                          <span className="rounded bg-[#F5F5F7] px-2 py-0.5 text-[11px] font-semibold text-[#1D1D1F]">CN: {workOrderC || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-card 3: Date & Shift Slot */}
            <div className="flex flex-col justify-between rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4.5">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                  Date & Shift Slot
                </p>
                <div className="space-y-3.5">
                  <div>
                    <label
                      htmlFor={`${uid}-date`}
                      className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
                    >
                      Date
                    </label>
                    <input
                      id={`${uid}-date`}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={cn(
                        "h-[42px] w-full rounded-[12px] border border-[#D2D2D7] bg-white px-3 text-[14px] font-medium text-[#1D1D1F] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20",
                        errors.date && "border-[#ff3b30]",
                      )}
                    />
                    {errors.date && (
                      <p className="mt-1 text-[12px] text-[#ff3b30]">{errors.date}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`${uid}-slot`}
                      className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
                    >
                      Time slot
                    </label>
                    <select
                      id={`${uid}-slot`}
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value as LegacyTimeSlot)}
                      className={cn(
                        "h-[42px] w-full rounded-[12px] border border-[#D2D2D7] bg-white px-3 text-[14px] font-medium text-[#1D1D1F] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20",
                        errors.timeSlot && "border-[#ff3b30]",
                      )}
                    >
                      <option value="" disabled>
                        Select a 2-hour shift slot...
                      </option>
                      {TIME_SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.timeSlot && (
                      <p className="mt-1 text-[12px] text-[#ff3b30]">{errors.timeSlot}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* ── Single combined Panel for Department & Process Log Entries ── */}
        <Panel
          title={`Department & Productivity Log (${activeDept.label})`}
          description="Select a department and enter output counts for each sub-process."
        >
          <div className="space-y-5">
            {/* Department Selection */}
            <div className="rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4.5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                Select Department
              </p>
              <div className="flex flex-wrap gap-3">
                {DEPT_TABS.map((dept) => {
                  const isActive = activeDeptId === dept.id;
                  const Icon = dept.icon;

                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        setActiveDeptId(dept.id);
                        setSavedMessage(null);
                        setErrors({});
                      }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[12px] border px-4 py-3 text-[13px] font-bold transition-all duration-200 cursor-pointer",
                        isActive
                          ? "border-[#0071E3] bg-[#0071E3] text-white shadow-[0_2px_8px_rgba(0,113,227,0.25)]"
                          : "border-[#D2D2D7] bg-white text-[#1D1D1F] hover:border-[#0071E3]/40 hover:bg-[#F5F5F7]",
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-[#6E6E73]")}
                        strokeWidth={isActive ? 2.2 : 1.75}
                      />
                      <span>{dept.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Process Log Entries */}
            <div className="rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4.5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                Process Log Entries ({activeDept.label})
              </p>

              {errors.rows && (
                <div className="mb-4 rounded-[12px] border border-[#FFD0D0] bg-[#FFF2F2] p-3.5 text-[13px] text-[#DC2626]">
                  {errors.rows}
                </div>
              )}

              <div className="overflow-x-auto rounded-[12px] border border-[#D2D2D7] bg-white">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#D2D2D7] bg-[#F5F5F7]/80 text-[11px] font-bold uppercase tracking-[0.05em] text-[#6E6E73]">
                      <th className="px-4 py-3 min-w-[220px]">Sub-Process</th>
                      <th className="px-4 py-3 min-w-[120px]">Output Count</th>
                      <th className="px-4 py-3 min-w-[180px]">Personnel Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2D2D7]">
                    {rows.map((row, index) => {
                      const isFilled = row.output.trim() !== "" && Number(row.output) > 0;
                      return (
                        <tr
                          key={row.subProcess}
                          className={cn(
                            "transition-colors",
                            isFilled ? "bg-[#0071E3]/5" : "hover:bg-[#F5F5F7]/40",
                          )}
                        >
                          <td className="px-4 py-3 font-semibold text-[#1D1D1F]">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#0071E3]" />
                              <span>{row.subProcess}</span>
                              {row.subProcess === "Good" && (
                                <span className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-bold text-[#6E6E73] border border-[#D2D2D7]">
                                  Passed Good
                                </span>
                              )}
                              {row.subProcess === "Buffer" && (
                                <span className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-bold text-[#6E6E73] border border-[#D2D2D7]">
                                  Buffer Tanks
                                </span>
                              )}
                              {row.subProcess === "Reject" && (
                                <span className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-bold text-[#6E6E73] border border-[#D2D2D7]">
                                  Reject Tanks
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={row.output}
                              onChange={(e) =>
                                updateRow(index, "output", e.target.value.replace(/\D/g, ""))
                              }
                              placeholder="0"
                              className="h-[38px] w-24 rounded-[10px] border border-[#D2D2D7] bg-white px-3 text-center text-[14px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={row.personnel}
                              onChange={(e) => updateRow(index, "personnel", e.target.value)}
                              placeholder="e.g. J. Dela Cruz"
                              className="h-[38px] w-full max-w-[240px] rounded-[10px] border border-[#D2D2D7] bg-white px-3 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between pt-2 border-t border-[#D2D2D7]">
            <p className="text-[13px] text-[#6E6E73]">
              Filled entries to save:{" "}
              <strong className="text-[#1D1D1F]">{totalFilledCount} process(es)</strong>
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#0071E3] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(0,113,227,0.25)] transition hover:bg-[#005bb5] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving to Cloud Firestore...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Save All Log Entries
                </>
              )}
            </button>
          </div>
        </Panel>
      </form>
    </PageShell>
  );
}
