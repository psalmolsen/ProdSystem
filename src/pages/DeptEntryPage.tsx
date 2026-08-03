import { useState, useEffect, useMemo, useId } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { PageShell, Panel } from "@/components/app/page-shell";
import { STATIONS, TIME_SLOTS } from "@/config/stations";
import type { TimeSlot } from "@/config/stations";
import type { StationId } from "@/types/tracker";
import { useTracker } from "@/hooks/useTracker";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProcessRow {
  subProcess: string;
  output: string;
  personnel: string;
}

interface FormErrors {
  jobOrder?: string;
  date?: string;
  timeSlot?: string;
  rows?: string; // at least one row must have data
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── DeptEntryPage ─────────────────────────────────────────────────────────────
export function DeptEntryPage({ stationId }: { stationId: StationId }) {
  const station = STATIONS.find((s) => s.id === stationId)!;
  const { jobOrders, addEntry, addJobOrder } = useTracker();

  // ── Header state ────────────────────────────────────────────────────────────
  const [selectedJoId, setSelectedJoId] = useState<string>("");
  const [date,     setDate]     = useState(todayValue());
  const [timeSlot, setTimeSlot] = useState<TimeSlot | "">("");
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [saved,    setSaved]    = useState(false);
  const uid = useId();

  // Auto-select first JO on load
  useEffect(() => {
    if (jobOrders.length > 0 && !selectedJoId) {
      setSelectedJoId(jobOrders[0].id);
    }
  }, [jobOrders, selectedJoId]);

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

  // ── Process rows state ───────────────────────────────────────────────────────
  const [rows, setRows] = useState<ProcessRow[]>(() =>
    station.subProcesses.map((sp) => ({ subProcess: sp, output: "", personnel: "" })),
  );

  // Reset rows when station changes (if this component is reused)
  useEffect(() => {
    setRows(station.subProcesses.map((sp) => ({ subProcess: sp, output: "", personnel: "" })));
    setSaved(false);
    setErrors({});
  }, [stationId, station.subProcesses]);

  const updateRow = (index: number, field: keyof Omit<ProcessRow, "subProcess">, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: FormErrors = {};

    if (!selectedJoId) next.jobOrder = "Select a job order.";
    if (!date)         next.date     = "Select a date.";
    if (!timeSlot)     next.timeSlot = "Select a time slot.";

    // At least one row must have output
    const filledRows = rows.filter(
      (r) => r.output.trim() !== "" && Number(r.output) > 0,
    );
    if (filledRows.length === 0) {
      next.rows = "Enter at least one output count.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Validate individual row outputs
    let hasRowError = false;
    for (const row of filledRows) {
      if (!Number.isInteger(Number(row.output)) || Number(row.output) <= 0) {
        hasRowError = true;
      }
    }
    if (hasRowError) return;

    // Save all filled rows
    for (const row of filledRows) {
      addEntry({
        jobOrderId:    selectedJoId,
        station:       stationId,
        subProcess:    row.subProcess,
        personnelName: row.personnel.trim() || "—",
        output:        Math.round(Number(row.output)),
        timeSlot:      timeSlot as TimeSlot,
        entryDate:     date,
      });
    }

    // Clear only counts — keep header and personnel for quick re-entry
    setRows((prev) => prev.map((r) => ({ ...r, output: "" })));
    setSaved(true);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title={station.label}
      breadcrumb={["CCB", "Production", station.label]}
    >
      <form onSubmit={submit} noValidate className="space-y-4">

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <Panel title="Job details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

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
                className={cn("input-field", errors.jobOrder && "border-[#ff3b30]")}
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

            {/* Work Order (read from selected JO) */}
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-[#1D1D1F]">Work order</p>
              <div className="flex h-[44px] items-center rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] px-3.5 text-[14px] text-[#1D1D1F]">
                {selectedJo?.workOrderNumber ?? <span className="text-[#6E6E73]">—</span>}
              </div>
            </div>

            {/* Brand Name (read from selected JO) */}
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

            {/* Time slot */}
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
        </Panel>

        {/* ── Process rows card ──────────────────────────────────────────── */}
        <Panel title="Processes">
          {/* Column headers */}
          <div className="mb-2 hidden grid-cols-[1fr_160px_220px] gap-4 border-b border-[#D2D2D7] pb-2 sm:grid">
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

          {/* Rows */}
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div
                key={row.subProcess}
                className={cn(
                  "grid items-center gap-3 rounded-[12px] p-3 transition-colors duration-150",
                  "sm:grid-cols-[1fr_160px_220px] sm:rounded-none sm:p-0",
                  // highlight rows that have a value
                  row.output
                    ? "bg-[rgba(0,113,227,0.05)] sm:bg-transparent"
                    : "bg-[#FAFAFA] sm:bg-transparent",
                )}
              >
                {/* Process name */}
                <p className="text-[14px] font-medium text-[#1D1D1F]">
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
                    placeholder="Name (optional)"
                    className="input-field"
                  />
                </div>
              </div>
            ))}
          </div>

          {errors.rows && (
            <p className="mt-3 text-[13px] font-medium text-[#ff3b30]">{errors.rows}</p>
          )}

          {/* Submit row */}
          <div className="mt-6 flex items-center gap-4 border-t border-[#D2D2D7] pt-5">
            <button type="submit" className="btn-primary">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Log all entries
            </button>

            {saved && (
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#34c759]">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                Entries saved — ready for next batch.
              </div>
            )}
          </div>
        </Panel>

      </form>
    </PageShell>
  );
}
