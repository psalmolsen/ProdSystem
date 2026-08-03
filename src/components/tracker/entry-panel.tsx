import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, ClipboardList, Plus, X } from "lucide-react";
import type { Entry, StationId } from "@/types/tracker";
import { Panel } from "@/components/app/page-shell";
import { STATIONS, TIME_SLOTS, type TimeSlot } from "@/config/stations";
import { cn } from "@/lib/utils";

interface EntryPanelProps {
  jobOrderId: string;
  /** If provided, the panel is "locked" to this station/sub-process (clicked from flow map).
   *  If null, the user picks department + process freely. */
  station: StationId | null;
  subProcess: string | null;
  total: number;
  entries: Entry[];
  recentPersonnel: string[];
  onAddEntry: (input: {
    station: StationId;
    subProcess: string;
    personnelName: string;
    output: number;
    timeSlot: TimeSlot;
    entryDate: string;
  }) => void;
  onClose: () => void;
}

interface FormErrors {
  station?: string;
  subProcess?: string;
  timeSlot?: string;
  entryDate?: string;
  personnel?: string;
  output?: string;
}

// Today as YYYY-MM-DD
function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EntryPanel({
  station: lockedStation,
  subProcess: lockedSubProcess,
  total,
  entries,
  recentPersonnel,
  onAddEntry,
  onClose,
}: EntryPanelProps) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedStation, setSelectedStation] = useState<StationId | "">(
    lockedStation ?? "",
  );
  const [selectedProcess, setSelectedProcess] = useState(lockedSubProcess ?? "");
  const [timeSlot, setTimeSlot]               = useState<TimeSlot | "">(""); 
  const [entryDate, setEntryDate]             = useState(todayValue());
  const [personnel, setPersonnel]             = useState("");
  const [output, setOutput]                   = useState("");
  const [errors, setErrors]                   = useState<FormErrors>({});
  const [saved, setSaved]                     = useState(false);
  const listId                                = useId();

  // Available processes for the currently selected department
  const availableProcesses = useMemo(() => {
    if (lockedStation) {
      return (
        STATIONS.find((s) => s.id === lockedStation)?.subProcesses ?? []
      );
    }
    if (!selectedStation) return [];
    return STATIONS.find((s) => s.id === selectedStation)?.subProcesses ?? [];
  }, [lockedStation, selectedStation]);

  // Reset process when department changes
  useEffect(() => {
    if (!lockedStation) setSelectedProcess("");
  }, [selectedStation, lockedStation]);

  // Reset form when the locked step changes
  useEffect(() => {
    setSelectedStation(lockedStation ?? "");
    setSelectedProcess(lockedSubProcess ?? "");
    setPersonnel("");
    setOutput("");
    setErrors({});
    setSaved(false);
  }, [lockedStation, lockedSubProcess]);

  // Auto-clear saved banner
  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(t);
  }, [saved]);

  // ── Submission ─────────────────────────────────────────────────────────────
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: FormErrors = {};
    const stationVal   = (lockedStation ?? selectedStation) as StationId | "";
    const processVal   = lockedSubProcess ?? selectedProcess;
    const personVal    = personnel.trim();
    const outputVal    = Number(output);

    if (!stationVal)   next.station   = "Select a department.";
    if (!processVal)   next.subProcess = "Select a process.";
    if (!timeSlot)     next.timeSlot  = "Select a time slot.";
    if (!entryDate)    next.entryDate = "Select a date.";
    if (!personVal)    next.personnel = "Personnel name is required.";
    if (!output.trim() || !Number.isInteger(outputVal) || outputVal <= 0) {
      next.output = "Enter a whole number greater than 0.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onAddEntry({
      station:      stationVal as StationId,
      subProcess:   processVal,
      personnelName: personVal,
      output:       outputVal,
      timeSlot:     timeSlot as TimeSlot,
      entryDate,
    });

    setPersonnel("");
    setOutput("");
    setSaved(true);
  };

  // ── Bar chart helpers ──────────────────────────────────────────────────────
  const rows = useMemo(
    () => [...entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)),
    [entries],
  );
  const maxEntry = useMemo(
    () => entries.reduce((max, e) => Math.max(max, e.output), 0),
    [entries],
  );

  const isLocked  = !!lockedStation && !!lockedSubProcess;
  const panelTitle = isLocked
    ? lockedSubProcess!
    : selectedProcess || "Log entry";
  const panelDesc  = isLocked
    ? `${STATIONS.find((s) => s.id === lockedStation)?.label} · ${total} units logged`
    : undefined;

  return (
    <Panel
      title={panelTitle}
      description={panelDesc}
      actions={
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="btn-icon"
        >
          <X className="h-[17px] w-[17px]" strokeWidth={1.5} />
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* ── Input form ─────────────────────────────────────────────────── */}
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="eyebrow">Log output</p>

          {/* Department — only shown when not locked */}
          {!isLocked && (
            <div>
              <label
                htmlFor={`${listId}-dept`}
                className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
              >
                Department
              </label>
              <select
                id={`${listId}-dept`}
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value as StationId)}
                className={cn("input-field", errors.station && "border-[#ff3b30]")}
              >
                <option value="">Select department…</option>
                {STATIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {errors.station && (
                <p className="mt-1.5 text-[12px] font-medium text-[#ff3b30]">
                  {errors.station}
                </p>
              )}
            </div>
          )}

          {/* Process — only shown when not locked */}
          {!isLocked && (
            <div>
              <label
                htmlFor={`${listId}-process`}
                className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
              >
                Process
              </label>
              <select
                id={`${listId}-process`}
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                disabled={availableProcesses.length === 0}
                className={cn("input-field", errors.subProcess && "border-[#ff3b30]")}
              >
                <option value="">
                  {availableProcesses.length === 0
                    ? "Select a department first…"
                    : "Select process…"}
                </option>
                {availableProcesses.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.subProcess && (
                <p className="mt-1.5 text-[12px] font-medium text-[#ff3b30]">
                  {errors.subProcess}
                </p>
              )}
            </div>
          )}

          {/* Date + Time slot — always shown, side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`${listId}-date`}
                className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
              >
                Date
              </label>
              <input
                id={`${listId}-date`}
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className={cn("input-field", errors.entryDate && "border-[#ff3b30]")}
              />
              {errors.entryDate && (
                <p className="mt-1.5 text-[12px] font-medium text-[#ff3b30]">
                  {errors.entryDate}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${listId}-slot`}
                className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
              >
                Time slot
              </label>
              <select
                id={`${listId}-slot`}
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
                className={cn("input-field", errors.timeSlot && "border-[#ff3b30]")}
              >
                <option value="">Select slot…</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {errors.timeSlot && (
                <p className="mt-1.5 text-[12px] font-medium text-[#ff3b30]">
                  {errors.timeSlot}
                </p>
              )}
            </div>
          </div>

          {/* Personnel */}
          <div>
            <label
              htmlFor={`${listId}-personnel`}
              className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
            >
              Personnel
            </label>
            <input
              id={`${listId}-personnel`}
              list={`${listId}-names`}
              value={personnel}
              onChange={(e) => setPersonnel(e.target.value)}
              placeholder="e.g. J. Dela Cruz"
              className={cn("input-field", errors.personnel && "border-[#ff3b30]")}
            />
            <datalist id={`${listId}-names`}>
              {recentPersonnel.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {errors.personnel && (
              <p className="mt-1.5 text-[12px] font-medium text-[#ff3b30]">
                {errors.personnel}
              </p>
            )}
          </div>

          {/* Output count */}
          <div>
            <label
              htmlFor={`${listId}-output`}
              className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]"
            >
              Output count
            </label>
            <input
              id={`${listId}-output`}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="0"
              className={cn(
                "input-field tabular",
                errors.output && "border-[#ff3b30]",
              )}
            />
            {errors.output && (
              <p className="mt-1.5 text-[12px] font-medium text-[#ff3b30]">
                {errors.output}
              </p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary w-full">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Log entry
          </button>

          {/* Success flash */}
          {saved && (
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#34c759]">
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
              Entry logged — keep going.
            </div>
          )}
        </form>

        {/* ── Personnel output chart ──────────────────────────────────────── */}
        <div>
          <p className="eyebrow mb-3">Personnel output</p>
          {rows.length === 0 ? (
            <div className="grid min-h-[200px] place-items-center rounded-[12px] border border-dashed border-[#D2D2D7] p-6 text-center">
              <div className="max-w-xs">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-[12px] bg-[rgba(0,113,227,0.08)]">
                  <ClipboardList className="h-5 w-5 text-[#0071E3]" strokeWidth={1.5} />
                </span>
                <p className="mt-4 text-[13px] font-medium text-[#1D1D1F]/80">
                  No entries yet
                </p>
                <p className="mt-1 text-xs leading-[1.5] text-[#6E6E73]">
                  Log the first output to start this step.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((entry) => (
                <li key={entry.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="min-w-0 truncate text-[12px] font-medium text-[#1D1D1F]"
                      title={entry.personnelName}
                    >
                      {entry.personnelName}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-medium text-[#6E6E73]">
                        {entry.timeSlot}
                      </span>
                      <span className="w-8 text-right text-[12px] font-semibold tabular text-[#1D1D1F]">
                        {entry.output}
                      </span>
                    </div>
                  </div>
                  <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[#F5F5F7]">
                    <span
                      className="block h-full rounded-full bg-[#0071E3]"
                      style={{
                        width: `${maxEntry > 0 ? Math.max(3, (entry.output / maxEntry) * 100) : 0}%`,
                        transition: "width 400ms cubic-bezier(0.4,0,0.2,1)",
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
