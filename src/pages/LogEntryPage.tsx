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
} from "lucide-react";
import { PageShell, Panel } from "@/components/app/page-shell";
import { STATIONS, TIME_SLOTS } from "@/config/stations";
import type { TimeSlot } from "@/config/stations";
import type { StationId } from "@/types/tracker";
import { useTracker } from "@/hooks/useTracker";
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
  const { jobOrders, addEntry, addJobOrder } = useTracker();
  const uid = useId();

  // ── Dept selection ─────────────────────────────────────────────────────────
  const [activeDeptId, setActiveDeptId] = useState<StationId>("CTC1");
  const activeDept = useMemo(
    () => DEPT_TABS.find((d) => d.id === activeDeptId) || DEPT_TABS[0],
    [activeDeptId],
  );

  // ── Header state ───────────────────────────────────────────────────────────
  const [selectedJoId, setSelectedJoId] = useState<string>("");
  const [joNumber, setJoNumber] = useState<string>("");
  const [workOrderCnf, setWorkOrderCnf] = useState<string>("");
  const [workOrderCf, setWorkOrderCf] = useState<string>("");
  const [workOrderC, setWorkOrderC] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("");
  const [date, setDate] = useState(todayValue());
  const [timeSlot, setTimeSlot] = useState<TimeSlot | "">("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);

  // Auto-select first JO on load
  useEffect(() => {
    if (jobOrders.length > 0 && !selectedJoId && !joNumber) {
      setSelectedJoId(jobOrders[0].id);
      const match = jobOrders[0].workOrderNumber.match(/\d+/);
      setJoNumber(match ? match[0] : "");
      setBrandName(jobOrders[0].brandName || "");
    }
  }, [jobOrders, selectedJoId, joNumber]);

  // Auto-clear saved banner
  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(t);
  }, [saved]);

  const selectedJo = useMemo(
    () => jobOrders.find((o) => o.id === selectedJoId) ?? null,
    [jobOrders, selectedJoId],
  );

  const handleJoNumberChange = (numStr: string) => {
    const cleanNum = numStr.replace(/\D/g, "");
    setJoNumber(cleanNum);
    if (!cleanNum) {
      setSelectedJoId("");
      return;
    }
    const matched = jobOrders.find((o) => {
      const digits = o.workOrderNumber.replace(/\D/g, "");
      return digits === cleanNum;
    });
    if (matched) {
      setSelectedJoId(matched.id);
      setBrandName(matched.brandName);
    } else {
      setSelectedJoId("");
    }
  };

  const handleJoSelect = (id: string) => {
    setSelectedJoId(id);
    const matched = jobOrders.find((o) => o.id === id);
    if (matched) {
      const match = matched.workOrderNumber.match(/\d+/);
      setJoNumber(match ? match[0] : "");
      setBrandName(matched.brandName);
    }
  };

  // ── Process rows per department ────────────────────────────────────────────
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: FormErrors = {};

    let targetJoId = selectedJoId;
    if (!targetJoId && joNumber) {
      const existing = jobOrders.find(
        (o) => o.workOrderNumber.replace(/\D/g, "") === joNumber,
      );
      if (existing) {
        targetJoId = existing.id;
      } else {
        const created = addJobOrder(`JO# ${joNumber}`, "Standard");
        targetJoId = created.id;
        setSelectedJoId(created.id);
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
    if (Object.keys(next).length > 0 || !targetJoId) return;

    // Save filled entries from all departments
    for (const station of STATIONS) {
      const filled = filledByDept[station.id] || [];
      for (const row of filled) {
        const parsedOut = Math.max(0, Math.round(Number(row.output) || 0));

        addEntry({
          jobOrderId: targetJoId,
          station: station.id,
          subProcess: row.subProcess,
          personnelName: row.personnel.trim() || "—",
          output: Math.round(Number(row.output)),
          timeSlot: timeSlot as TimeSlot,
          entryDate: date,
        });
      }
    }

    // Reset output fields for all departments
    setAllDeptRows((prev) => {
      const updated = { ...prev };
      for (const station of STATIONS) {
        if (updated[station.id]) {
          updated[station.id] = updated[station.id].map((r) => ({ ...r, output: "" }));
        }
      }
      return updated;
    });

    setSaved(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Log Entry"
      breadcrumb={["CCB", "Production", "Log Entry"]}
    >
      <form onSubmit={submit} noValidate className="space-y-4">

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
                    setSaved(false);
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

                  {/* Active indicator dot */}
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
            <div className="flex flex-col justify-between rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4.5">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                  Job Identification
                </p>
                <div className="space-y-3.5">
                  <div>
                    <label
                      htmlFor={`${uid}-jo`}
                      className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
                    >
                      Job order
                    </label>
                    <div
                      className={cn(
                        "flex items-center overflow-hidden rounded-[12px] border border-[#D2D2D7] bg-white transition-all focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-[#0071E3]/20",
                        errors.jobOrder && "border-[#ff3b30]",
                      )}
                    >
                      <span className="flex h-[42px] select-none items-center border-r border-[#D2D2D7] bg-[#F5F5F7] px-3.5 text-[12px] font-bold text-[#1D1D1F] shrink-0">
                        JO#
                      </span>
                      <input
                        id={`${uid}-jo`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={joNumber}
                        onChange={(e) => handleJoNumberChange(e.target.value)}
                        placeholder="e.g. 2408"
                        className="h-[42px] w-full bg-transparent px-3 text-[14px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#A1A1A6]"
                      />
                    </div>
                    {errors.jobOrder && (
                      <p className="mt-1 text-[12px] text-[#ff3b30]">{errors.jobOrder}</p>
                    )}
                  </div>

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
                      placeholder="e.g. FireMaster"
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
                      className={cn("h-[42px] w-full rounded-[12px] border border-[#D2D2D7] bg-white px-3 text-[14px] font-medium text-[#1D1D1F] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20", errors.date && "border-[#ff3b30]")}
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
                      onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
                      className={cn("h-[42px] w-full rounded-[12px] border border-[#D2D2D7] bg-white px-3 text-[14px] font-medium text-[#1D1D1F] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 cursor-pointer", errors.timeSlot && "border-[#ff3b30]")}
                    >
                      <option value="">Select slot…</option>
                      {TIME_SLOTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
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

        {/* ── Process rows ─────────────────────────────────────────────────── */}
        <section className="rounded-[16px] border border-[#D2D2D7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D2D2D7] px-6 py-5">
            <div className="flex items-center gap-2">
              <activeDept.icon
                className="h-5 w-5"
                strokeWidth={2}
                style={{ color: activeDept.activeText }}
              />
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
                Step 3 — Log Output
              </h2>
              <span
                className="rounded-[8px] px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: activeDept.activeBg,
                  color: activeDept.activeText,
                }}
              >
                {activeDept.label}
              </span>
            </div>
          </header>
          <div className="p-6">
          {/* Column headers */}
          <div className="mb-2 hidden grid-cols-[1fr_160px_220px] gap-4 border-b border-[#D2D2D7] pb-2 sm:grid">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6E6E73]">Process</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6E6E73]">Output count</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6E6E73]">Personnel</p>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {rows.map((row, i) => {
              const hasValue = isRowFilled(row);
              return (
                <div
                  key={row.subProcess}
                  className={cn(
                    "grid items-center gap-3 rounded-[12px] p-3 transition-colors duration-150",
                    "sm:grid-cols-[1fr_160px_220px] sm:rounded-none sm:p-0",
                    hasValue ? "sm:bg-transparent" : "bg-[#FAFAFA] sm:bg-transparent",
                  )}
                  style={
                    hasValue
                      ? { backgroundColor: activeDept.activeBg }
                      : {}
                  }
                >
                  {/* Process name */}
                  <p
                    className="text-[14px] font-medium"
                    style={hasValue ? { color: activeDept.activeText } : { color: "#1D1D1F" }}
                  >
                    {row.subProcess}
                  </p>

                  {/* Output count */}
                  <div>
                    <label className="mb-1 block text-[11px] text-[#6E6E73] sm:hidden">
                      Output count
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={row.output}
                      onChange={(e) => updateRow(i, "output", e.target.value)}
                      placeholder="—"
                      className="input-field tabular text-center"
                    />
                  </div>

                  {/* Personnel */}
                  <div>
                    <label className="mb-1 block text-[11px] text-[#6E6E73] sm:hidden">
                      Personnel
                    </label>
                    <input
                      type="text"
                      value={row.personnel}
                      onChange={(e) => updateRow(i, "personnel", e.target.value)}
                      placeholder="Name"
                      className="input-field"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {errors.rows && (
            <p className="mt-3 text-[13px] font-medium text-[#ff3b30]">{errors.rows}</p>
          )}

          {/* Submit row */}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#D2D2D7] pt-5">
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 bg-[#0071E3] hover:bg-[#0071E3]/90 text-white font-semibold shadow-sm transition-all"
            >
              <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2} />
              <span>Save All Log Entries</span>
              {totalFilledCount > 0 && (
                <span className="ml-1 rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-bold text-white">
                  {totalFilledCount} {totalFilledCount === 1 ? "process" : "processes"}
                </span>
              )}
            </button>

            {saved && (
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#34c759]">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                All entries across all departments saved successfully!
              </div>
            )}
          </div>
          </div>
        </section>
      </form>
    </PageShell>
  );
}
