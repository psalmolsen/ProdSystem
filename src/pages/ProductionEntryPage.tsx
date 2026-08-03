import { useState, useEffect, useMemo, useId } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { STATIONS, TIME_SLOTS } from "@/config/stations";
import type { TimeSlot } from "@/config/stations";
import type { StationId } from "@/types/tracker";
import { useTracker } from "@/hooks/useTracker";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProcessRow {
  stationId: StationId;
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

// ── ProductionEntryPage ───────────────────────────────────────────────────────
export function ProductionEntryPage() {
  const { jobOrders, addEntry } = useTracker();
  const uid = useId();

  // ── Header state ─────────────────────────────────────────────────────────
  const [selectedJoId, setSelectedJoId] = useState<string>("");
  const [date,     setDate]     = useState(todayValue());
  const [timeSlot, setTimeSlot] = useState<TimeSlot | "">("");
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [saved,    setSaved]    = useState(false);

  // Track which department sections are collapsed (all open by default)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (stationId: string) => {
    setCollapsed((prev) => ({ ...prev, [stationId]: !prev[stationId] }));
  };

  // Auto-select first JO
  useEffect(() => {
    if (jobOrders.length > 0 && !selectedJoId) {
      setSelectedJoId(jobOrders[0].id);
    }
  }, [jobOrders, selectedJoId]);

  // Auto-clear saved banner
  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 3500);
    return () => window.clearTimeout(t);
  }, [saved]);

  const selectedJo = useMemo(
    () => jobOrders.find((o) => o.id === selectedJoId) ?? null,
    [jobOrders, selectedJoId],
  );

  // ── All process rows (flat, grouped by station) ───────────────────────────
  const [rows, setRows] = useState<ProcessRow[]>(() =>
    STATIONS.flatMap((s) =>
      s.subProcesses.map((sp) => ({
        stationId: s.id,
        subProcess: sp,
        output: "",
        personnel: "",
      })),
    ),
  );

  const updateRow = (
    stationId: StationId,
    subProcess: string,
    field: "output" | "personnel",
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.stationId === stationId && r.subProcess === subProcess
          ? { ...r, [field]: value }
          : r,
      ),
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: FormErrors = {};

    if (!selectedJoId) next.jobOrder = "Select a job order.";
    if (!date)         next.date     = "Select a date.";
    if (!timeSlot)     next.timeSlot = "Select a time slot.";

    const filledRows = rows.filter(
      (r) => r.output.trim() !== "" && Number(r.output) > 0,
    );
    if (filledRows.length === 0) next.rows = "Enter at least one output count to log.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    for (const row of filledRows) {
      addEntry({
        jobOrderId:    selectedJoId,
        station:       row.stationId,
        subProcess:    row.subProcess,
        personnelName: row.personnel.trim() || "—",
        output:        Math.round(Number(row.output)),
        timeSlot:      timeSlot as TimeSlot,
        entryDate:     date,
      });
    }

    // Clear only output counts — keep personnel and header for next round
    setRows((prev) => prev.map((r) => ({ ...r, output: "" })));
    setSaved(true);
  };

  // Count filled rows per station for the section badge
  const filledByStation = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.output.trim() !== "" && Number(r.output) > 0) {
        map[r.stationId] = (map[r.stationId] ?? 0) + 1;
      }
    }
    return map;
  }, [rows]);

  const totalFilled = Object.values(filledByStation).reduce((a, b) => a + b, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageShell title="Production Entry" breadcrumb={["CCB", "Production", "Entry"]}>
      <form onSubmit={submit} noValidate className="space-y-4">

        {/* ── Sticky header card ───────────────────────────────────────── */}
        <div className="sticky top-0 z-10 rounded-[16px] border border-[#D2D2D7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="p-5">
            <p className="eyebrow mb-4">Job details</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

              {/* Job Order */}
              <div className="lg:col-span-2">
                <label
                  htmlFor={`${uid}-jo`}
                  className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
                >
                  Job order
                </label>
                <select
                  id={`${uid}-jo`}
                  value={selectedJoId}
                  onChange={(e) => setSelectedJoId(e.target.value)}
                  className={cn("input-field font-medium", errors.jobOrder && "border-[#ff3b30]")}
                >
                  <option value="">Select job order…</option>
                  {jobOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.workOrderNumber} · {o.brandName}
                    </option>
                  ))}
                </select>
                {errors.jobOrder && (
                  <p className="mt-1 text-[12px] text-[#ff3b30]">{errors.jobOrder}</p>
                )}
              </div>

              {/* Work Order (read-only from JO) */}
              <div>
                <p className="mb-1.5 text-[12px] font-medium text-[#1D1D1F]">Work order</p>
                <div className="flex h-[44px] items-center rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] px-3.5 text-[14px] text-[#1D1D1F]">
                  {selectedJo?.workOrderNumber ?? <span className="text-[#6E6E73]">—</span>}
                </div>
              </div>

              {/* Brand Name (read-only from JO) */}
              <div>
                <p className="mb-1.5 text-[12px] font-medium text-[#1D1D1F]">Brand name</p>
                <div className="flex h-[44px] items-center rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] px-3.5 text-[14px] text-[#1D1D1F]">
                  {selectedJo?.brandName ?? <span className="text-[#6E6E73]">—</span>}
                </div>
              </div>

              {/* Date */}
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
                  className={cn("input-field", errors.date && "border-[#ff3b30]")}
                />
                {errors.date && (
                  <p className="mt-1 text-[12px] text-[#ff3b30]">{errors.date}</p>
                )}
              </div>

              {/* Time Slot */}
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
                  className={cn("input-field", errors.timeSlot && "border-[#ff3b30]")}
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

        {/* ── Department sections ─────────────────────────────────────── */}
        {STATIONS.map((station) => {
          const stationRows = rows.filter((r) => r.stationId === station.id);
          const filledCount = filledByStation[station.id] ?? 0;
          const isCollapsed = collapsed[station.id] ?? false;

          return (
            <div
              key={station.id}
              className="overflow-hidden rounded-[16px] border border-[#D2D2D7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            >
              {/* Section header — clickable to collapse */}
              <button
                type="button"
                onClick={() => toggleCollapse(station.id)}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-150 hover:bg-[#F5F5F7]"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
                    {station.label}
                  </h2>
                  {filledCount > 0 && (
                    <span className="rounded-full bg-[rgba(0,113,227,0.10)] px-2.5 py-0.5 text-[11px] font-semibold text-[#0071E3]">
                      {filledCount} filled
                    </span>
                  )}
                </div>
                <span className="text-[#6E6E73]">
                  {isCollapsed
                    ? <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                    : <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                  }
                </span>
              </button>

              {/* Process rows */}
              {!isCollapsed && (
                <div className="border-t border-[#D2D2D7]">
                  {/* Column headers — desktop only */}
                  <div className="hidden grid-cols-[1fr_140px_200px] gap-4 border-b border-[#D2D2D7] px-6 py-2.5 sm:grid">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6E6E73]">
                      Process
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6E6E73]">
                      Output count
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6E6E73]">
                      Personnel
                    </p>
                  </div>

                  <div className="divide-y divide-[#D2D2D7]">
                    {stationRows.map((row) => {
                      const hasValue = row.output.trim() !== "" && Number(row.output) > 0;
                      return (
                        <div
                          key={row.subProcess}
                          className={cn(
                            "grid items-center gap-3 px-6 py-3 transition-colors duration-150",
                            "grid-cols-1 sm:grid-cols-[1fr_140px_200px]",
                            hasValue && "bg-[rgba(0,113,227,0.03)]",
                          )}
                        >
                          {/* Process label */}
                          <p className={cn(
                            "text-[14px] font-medium",
                            hasValue ? "text-[#0071E3]" : "text-[#1D1D1F]",
                          )}>
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
                              onChange={(e) =>
                                updateRow(station.id, row.subProcess, "output", e.target.value)
                              }
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
                              onChange={(e) =>
                                updateRow(station.id, row.subProcess, "personnel", e.target.value)
                              }
                              placeholder="Name (optional)"
                              className="input-field"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Submit bar ─────────────────────────────────────────────── */}
        <div className="rounded-[16px] border border-[#D2D2D7] bg-white px-6 py-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {errors.rows && (
            <p className="mb-3 text-[13px] font-medium text-[#ff3b30]">{errors.rows}</p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn-primary">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Log {totalFilled > 0 ? `${totalFilled} entries` : "all entries"}
            </button>

            {totalFilled > 0 && (
              <p className="text-[13px] text-[#6E6E73]">
                <span className="font-semibold text-[#1D1D1F]">{totalFilled}</span> process
                {totalFilled !== 1 ? "es" : ""} filled across{" "}
                <span className="font-semibold text-[#1D1D1F]">
                  {Object.keys(filledByStation).length}
                </span>{" "}
                department{Object.keys(filledByStation).length !== 1 ? "s" : ""}
              </p>
            )}

            {saved && (
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#34c759]">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                All entries saved — ready for next batch.
              </div>
            )}
          </div>
        </div>

      </form>
    </PageShell>
  );
}
