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

  // Load Job Orders directly from Firestore
  const loadJobOrders = async () => {
    setLoadingOrders(true);
    try {
      const orders = await getAllJobOrders();
      setJobOrders(orders);
      if (orders.length > 0 && !selectedJoId && !joNumber) {
        setSelectedJoId(orders[0].id);
        const match = orders[0].workOrder.match(/\d+/);
        setJoNumber(match ? match[0] : orders[0].workOrder);
        setBrandName(orders[0].brand || "");
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
      return digits === cleanNum;
    });
    if (matched) {
      setSelectedJoId(matched.id);
      setBrandName(matched.brand);
    } else {
      setSelectedJoId("");
    }
  };

  // Process rows per department
  const [allDeptRows, setAllDeptRows] = useState<Record<StationId, ProcessRow[]>>(() => {
    const initial: Partial<Record<StationId, ProcessRow[]>> = {};
    for (const station of STATIONS) {
      initial[station.id] = station.subProcesses.map((sp) => ({
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
    for (const station of STATIONS) {
      const deptRows = allDeptRows[station.id] || [];
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

    for (const station of STATIONS) {
      const deptRows = allDeptRows[station.id] || [];
      const filled = deptRows.filter(isRowFilled);
      filledByDept[station.id] = filled;
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

      for (const station of STATIONS) {
        const filled = filledByDept[station.id] || [];
        for (const row of filled) {
          const parsedOut = Math.max(0, Math.round(Number(row.output) || 0));
          const mappedProcess = mapSubProcessToEngine(station.id, row.subProcess);

          await updateProductionValue({
            jobOrderId: targetJoId,
            dateStr: date,
            department: station.id as DepartmentName,
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

        {/* ── Department selector ──────────────────────────────────────────── */}
        <section className="rounded-[16px] border border-[#D2D2D7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="border-b border-[#D2D2D7] px-6 pt-5 pb-4">
            <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6E6E73]">
              Step 1 — Select Department
            </p>
            <p className="text-[13px] text-[#6E6E73]">
              Choose the department you are logging entries for.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 p-5">
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
                  style={
                    isActive
                      ? {
                          backgroundColor: dept.activeBg,
                          color: dept.activeText,
                          borderColor: dept.activeBorder,
                        }
                      : {}
                  }
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-[12px] border px-4 py-3 text-[13px] font-medium transition-all duration-200",
                    isActive
                      ? "shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
                      : "border-[#D2D2D7] bg-[#F5F5F7] text-[#1D1D1F]/60 hover:border-[#C7C7CC] hover:bg-white hover:text-[#1D1D1F]",
                  )}
                >
                  <Icon
                    className="h-[17px] w-[17px] shrink-0"
                    strokeWidth={isActive ? 2 : 1.5}
                    style={isActive ? { color: dept.activeText } : {}}
                  />
                  <span>{dept.label}</span>

                  {isActive && (
                    <span
                      className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: dept.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Job details ──────────────────────────────────────────────────── */}
        <Panel title="Step 2 — Job Details">
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Sub-card 1: Job Identification */}
            <div className="flex flex-col justify-between rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4.5 lg:col-span-1">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                  Job Identification
                </p>
                <div className="space-y-3.5">
                  {/* Job Order Dropdown Choice */}
                  <div>
                    <label
                      htmlFor={`${uid}-jo-select`}
                      className="mb-1.5 block text-[12px] font-semibold text-[#1D1D1F]"
                    >
                      Select Job Order (JO#)
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
                          setSelectedJoId(val);
                          const matched = jobOrders.find((o) => o.id === val);
                          if (matched) {
                            const match = matched.workOrder.match(/\d+/);
                            setJoNumber(match ? match[0] : matched.workOrder);
                            setBrandName(matched.brand || "");
                          } else if (val === "NEW") {
                            setSelectedJoId("");
                            setJoNumber("");
                            setBrandName("");
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
                            {jo.id} — {jo.brand || "Standard"} ({jo.workOrder})
                          </option>
                        ))}
                        <option value="NEW">+ Create New Job Order...</option>
                      </select>
                    )}
                    {errors.jobOrder && (
                      <p className="mt-1 text-[12px] text-[#ff3b30]">{errors.jobOrder}</p>
                    )}
                  </div>

                  {/* Quick JO Clickable Pills */}
                  {jobOrders.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                        Click to Select JO#:
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {jobOrders.map((jo) => {
                          const isSelected = selectedJoId === jo.id;
                          return (
                            <button
                              key={jo.id}
                              type="button"
                              onClick={() => {
                                setSelectedJoId(jo.id);
                                const match = jo.workOrder.match(/\d+/);
                                setJoNumber(match ? match[0] : jo.workOrder);
                                setBrandName(jo.brand || "");
                                setErrors((prev) => ({ ...prev, jobOrder: undefined }));
                              }}
                              className={cn(
                                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-all cursor-pointer",
                                isSelected
                                  ? "border-[#0071E3] bg-[#0071E3] text-white shadow-sm"
                                  : "border-[#D2D2D7] bg-white text-[#1D1D1F] hover:border-[#0071E3] hover:bg-[#0071E3]/5",
                              )}
                            >
                              <span>{jo.id}</span>
                              <span
                                className={cn(
                                  "text-[10px] font-normal",
                                  isSelected ? "text-white/80" : "text-[#6E6E73]",
                                )}
                              >
                                ({jo.brand || jo.workOrder})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected JO Details */}
                  <div>
                    <label
                      htmlFor={`${uid}-brand`}
                      className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
                    >
                      Brand name
                    </label>
                    <input
                      id={`${uid}-brand`}
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. FireMaster / Akxel"
                      className="h-[42px] w-full rounded-[12px] border border-[#D2D2D7] bg-white px-3 text-[14px] font-medium text-[#1D1D1F] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-card 2: Work Order Quantities (CNF, CF, C) */}
            <div className="rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4.5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                Work Order Quantities
              </p>
              <div className="space-y-2.5">
                {/* CNF */}
                <div className="flex items-center overflow-hidden rounded-[12px] border border-[#D2D2D7] bg-white transition-all focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-[#0071E3]/20">
                  <span className="flex h-[40px] w-[70px] select-none items-center justify-center border-r border-[#D2D2D7] bg-[#F5F5F7] text-[12px] font-bold text-[#1D1D1F] shrink-0">
                    CNF
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={workOrderCnf}
                    onChange={(e) => setWorkOrderCnf(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="h-[40px] w-full bg-transparent px-3 text-[14px] font-medium tabular text-[#1D1D1F] outline-none placeholder:text-[#A1A1A6]"
                  />
                </div>

                {/* CF */}
                <div className="flex items-center overflow-hidden rounded-[12px] border border-[#D2D2D7] bg-white transition-all focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-[#0071E3]/20">
                  <span className="flex h-[40px] w-[70px] select-none items-center justify-center border-r border-[#D2D2D7] bg-[#F5F5F7] text-[12px] font-bold text-[#1D1D1F] shrink-0">
                    CF
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={workOrderCf}
                    onChange={(e) => setWorkOrderCf(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="h-[40px] w-full bg-transparent px-3 text-[14px] font-medium tabular text-[#1D1D1F] outline-none placeholder:text-[#A1A1A6]"
                  />
                </div>

                {/* C */}
                <div className="flex items-center overflow-hidden rounded-[12px] border border-[#D2D2D7] bg-white transition-all focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-[#0071E3]/20">
                  <span className="flex h-[40px] w-[70px] select-none items-center justify-center border-r border-[#D2D2D7] bg-[#F5F5F7] text-[12px] font-bold text-[#1D1D1F] shrink-0">
                    C
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={workOrderC}
                    onChange={(e) => setWorkOrderC(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="h-[40px] w-full bg-transparent px-3 text-[14px] font-medium tabular text-[#1D1D1F] outline-none placeholder:text-[#A1A1A6]"
                  />
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

        {/* ── Process rows table ─────────────────────────────────────────────── */}
        <Panel
          title={`Step 3 — Process Log Entries (${activeDept.label})`}
          description="Enter output count for each process performed during this time slot."
        >
          {errors.rows && (
            <div className="mb-4 rounded-[12px] border border-[#FFD0D0] bg-[#FFF2F2] p-3.5 text-[13px] text-[#DC2626]">
              {errors.rows}
            </div>
          )}

          <div className="overflow-x-auto rounded-[12px] border border-[#D2D2D7]">
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
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: activeDept.color }}
                          />
                          <span>{row.subProcess}</span>
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
