import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Lock,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  GaugeCircle,
  Wrench,
  PaintRoller,
  Droplets,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageShell, Panel } from "@/components/app/page-shell";
import { DEPARTMENTS, DepartmentName } from "@/constants/departments";
import { PROCESSES_BY_DEPARTMENT } from "@/constants/processes";
import { TIME_SLOTS, TimeSlot } from "@/constants/timeSlots";
import { isProductionLocked } from "@/engine/productionEngine";
import type { JobOrder } from "@/types/jobOrder";
import type { ProductionDayDocument } from "@/types/production";
import { getAllJobOrders } from "@/services/firestore/jobOrderService";
import {
  getOrCreateProductionDay,
  updateProductionValue,
} from "@/services/firestore/productionService";
import { todayIsoDate } from "@/utils/date";
import { cn } from "@/lib/utils";

const DEPT_ICONS: Record<DepartmentName, typeof ClipboardCheck> = {
  CTC1: ClipboardCheck,
  CTC2: GaugeCircle,
  Hotworks: Wrench,
  Painting: PaintRoller,
  Cosmetics: Droplets,
};

const DEPT_COLORS: Record<DepartmentName, string> = {
  CTC1: "#0071E3",
  CTC2: "#5856D6",
  Hotworks: "#FF9500",
  Painting: "#34C759",
  Cosmetics: "#FF375F",
};

export function ProductionEntryPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [selectedJoId, setSelectedJoId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayIsoDate());

  const [docData, setDocData] = useState<ProductionDayDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active department tab
  const [activeDept, setActiveDept] = useState<DepartmentName>("CTC1");
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});

  const toggleCollapse = (dept: string) => {
    setCollapsedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  // 1. Fetch Job Orders list
  const loadJobOrders = useCallback(async () => {
    try {
      const orders = await getAllJobOrders({ status: "Active" });
      setJobOrders(orders);
      if (orders.length > 0 && !selectedJoId) {
        setSelectedJoId(orders[0].id);
      }
    } catch (err) {
      console.error("Failed to load active Job Orders:", err);
    }
  }, [selectedJoId]);

  useEffect(() => {
    loadJobOrders();
  }, [loadJobOrders]);

  // 2. Lazy load or create today's production day document
  const loadProductionDoc = useCallback(async () => {
    if (!selectedJoId || !selectedDate) return;
    setLoading(true);
    setError(null);
    try {
      const docResult = await getOrCreateProductionDay(selectedJoId, selectedDate);
      setDocData(docResult);
    } catch (err) {
      console.error("Failed to load production day document:", err);
      setError("Failed to load production document from Firestore.");
    } finally {
      setLoading(false);
    }
  }, [selectedJoId, selectedDate]);

  useEffect(() => {
    loadProductionDoc();
  }, [loadProductionDoc]);

  const selectedJo = useMemo(
    () => jobOrders.find((jo) => jo.id === selectedJoId) ?? null,
    [jobOrders, selectedJoId],
  );

  const locked = useMemo(() => isProductionLocked(docData), [docData]);

  // ── Handle Quantity Cell Updates ───────────────────────────────────────────
  const handleSlotChange = async (
    dept: DepartmentName,
    proc: string,
    slot: TimeSlot,
    newRawValue: string,
  ) => {
    if (!selectedJoId || !selectedDate || locked) return;

    const parsedVal = Math.max(0, Math.round(Number(newRawValue.trim()) || 0));
    const slotKey = `${dept}-${proc}-${slot}`;
    setSavingSlot(slotKey);
    setError(null);

    // Optimistic local state update
    if (docData) {
      const copy = { ...docData };
      const deptObj = { ...copy[dept] };
      const procObj = { ...deptObj[proc], [slot]: parsedVal };
      deptObj[proc] = procObj;
      copy[dept] = deptObj;
      setDocData(copy);
    }

    try {
      await updateProductionValue({
        jobOrderId: selectedJoId,
        dateStr: selectedDate,
        department: dept,
        processName: proc,
        timeSlot: slot,
        value: parsedVal,
        operatorName: "Operator (Plant Floor)",
      });

      // Reload fresh document & summary from Firestore
      const refreshed = await getOrCreateProductionDay(selectedJoId, selectedDate);
      setDocData(refreshed);
    } catch (err) {
      console.error("Failed to update slot value:", err);
      setError(`Failed to save quantity: ${(err as Error).message}`);
      await loadProductionDoc(); // rollback
    } finally {
      setSavingSlot(null);
    }
  };

  return (
    <PageShell
      title="Production Encoding Entry"
      breadcrumb={["Overview", "Production Entry"]}
    >
      <div className="space-y-6">
        {/* ── Top Context Toolbar: Job Order & Date Pickers ───────────────────── */}
        <div className="flex flex-col gap-4 rounded-[16px] border border-[#D2D2D7] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Job Order Selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                Job Order
              </label>
              <select
                value={selectedJoId}
                onChange={(e) => setSelectedJoId(e.target.value)}
                className="mt-1 min-w-[200px] rounded-[10px] border border-[#D2D2D7] bg-[#F5F5F7] px-3 py-2 text-[14px] font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
              >
                {jobOrders.map((jo) => (
                  <option key={jo.id} value={jo.id}>
                    {jo.workOrder} — {jo.brand} ({jo.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                Production Date
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-[10px] border border-[#D2D2D7] bg-[#F5F5F7] px-3 py-2 pr-8 text-[14px] font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadProductionDoc}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#D2D2D7] bg-white px-3.5 py-2 text-[13px] font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Sync Matrix
            </button>
          </div>
        </div>

        {/* ── Summary Banner (Directly from doc.summary) ────────────────────── */}
        {docData && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Completion % */}
            <div className="rounded-[16px] border border-[#D2D2D7] bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                Completion %
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[24px] font-bold tracking-tight text-[#0071E3]">
                  {docData.summary.completionPercent}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#F5F5F7]">
                <div
                  className="h-1.5 rounded-full bg-[#0071E3] transition-all duration-300"
                  style={{ width: `${Math.min(100, docData.summary.completionPercent)}%` }}
                />
              </div>
            </div>

            {/* Total Good Count */}
            <div className="rounded-[16px] border border-[#D2D2D7] bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                Total Output
              </p>
              <p className="mt-1 text-[24px] font-bold tracking-tight text-[#1D1D1F]">
                {docData.summary.totalGood.toLocaleString()}{" "}
                <span className="text-[13px] font-normal text-[#6E6E73]">cylinders</span>
              </p>
            </div>

            {/* Last Updated */}
            <div className="rounded-[16px] border border-[#D2D2D7] bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                Last Updated
              </p>
              <p className="mt-1 text-[14px] font-semibold text-[#1D1D1F] truncate">
                {docData.summary.lastUpdated
                  ? new Date(docData.summary.lastUpdated as string).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not updated yet"}
              </p>
              <p className="mt-0.5 text-[11px] text-[#6E6E73] truncate">
                {docData.summary.lastProcess
                  ? `${docData.summary.lastDepartment} • ${docData.summary.lastProcess}`
                  : "No entries logged today"}
              </p>
            </div>

            {/* Operator */}
            <div className="rounded-[16px] border border-[#D2D2D7] bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                Updated By
              </p>
              <p className="mt-1 text-[14px] font-semibold text-[#1D1D1F] truncate">
                {docData.lastUpdatedBy || "System Operator"}
              </p>
              <p className="mt-0.5 text-[11px] text-[#34C759] font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 inline" /> Active Day
              </p>
            </div>
          </div>
        )}

        {/* ── Locking Banner ────────────────────────────────────────────────── */}
        {locked && (
          <div className="flex items-center gap-3 rounded-[12px] bg-[#FFFBEB] p-4 text-[14px] font-semibold text-[#B45309] border border-[#FCD34D]">
            <Lock className="h-5 w-5 shrink-0 text-[#B45309]" />
            <span>Production has been finalized for this day. Edits are locked.</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-[12px] bg-[#FFF2F2] p-4 text-[13px] font-medium text-[#DC2626] border border-[#FFD0D0]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Department Navigation Tabs ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#D2D2D7] pb-2">
          {DEPARTMENTS.map((dept) => {
            const Icon = DEPT_ICONS[dept];
            const active = activeDept === dept;
            const color = DEPT_COLORS[dept];
            return (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={cn(
                  "flex items-center gap-2.5 rounded-[12px] px-4 py-2.5 text-[14px] font-semibold transition-all duration-200",
                  active
                    ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#D2D2D7]"
                    : "text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]",
                )}
                style={{ color: active ? color : undefined }}
              >
                <Icon className="h-4 w-4" />
                <span>{dept}</span>
              </button>
            );
          })}
        </div>

        {/* ── Production Matrix per Department ────────────────────────────────── */}
        {DEPARTMENTS.filter((d) => d === activeDept).map((dept) => {
          const processes = PROCESSES_BY_DEPARTMENT[dept];
          const Icon = DEPT_ICONS[dept];
          const color = DEPT_COLORS[dept];
          const isCollapsed = collapsedDepts[dept];

          return (
            <Panel
              key={dept}
              title={`${dept} Production Matrix`}
              description={`Log 2-hour interval cylinder quantities for ${dept} processes.`}
              actions={
                <button
                  onClick={() => toggleCollapse(dept)}
                  className="rounded-full p-1 text-[#6E6E73] hover:bg-[#F5F5F7]"
                >
                  {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </button>
              }
              padded={false}
            >
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead>
                      <tr className="border-b border-[#D2D2D7] bg-[#F5F5F7]/80 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                        <th className="px-6 py-3.5 min-w-[220px]">Sub-Process</th>
                        {TIME_SLOTS.map((slot) => (
                          <th key={slot} className="px-4 py-3.5 text-center min-w-[100px]">
                            {slot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D2D2D7]">
                      {processes.map((proc) => (
                        <tr key={proc} className="hover:bg-[#F5F5F7]/40 transition-colors">
                          {/* Process Name */}
                          <td className="px-6 py-4 font-semibold text-[#1D1D1F]">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span>{proc}</span>
                            </div>
                          </td>

                          {/* 2-Hour Time Slot Inputs */}
                          {TIME_SLOTS.map((slot) => {
                            const val = docData?.[dept]?.[proc]?.[slot] ?? 0;
                            const slotKey = `${dept}-${proc}-${slot}`;
                            const isSaving = savingSlot === slotKey;

                            return (
                              <td key={slot} className="px-3 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={locked || loading}
                                  defaultValue={val === 0 ? "" : val}
                                  key={`${selectedJoId}-${selectedDate}-${dept}-${proc}-${slot}-${val}`}
                                  placeholder="0"
                                  onBlur={(e) => {
                                    const nextVal = e.target.value;
                                    if (Number(nextVal || 0) !== val) {
                                      handleSlotChange(dept, proc, slot, nextVal);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className={cn(
                                    "w-20 rounded-[10px] border px-3 py-2 text-center text-[15px] font-bold tracking-tight outline-none transition-all duration-150",
                                    val > 0
                                      ? "border-[#0071E3] bg-[#0071E3]/5 text-[#0071E3]"
                                      : "border-[#D2D2D7] bg-[#F5F5F7] text-[#1D1D1F] hover:bg-white",
                                    "focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/25",
                                    locked && "cursor-not-allowed bg-[#F5F5F7] opacity-60",
                                    isSaving && "animate-pulse border-[#0071E3]",
                                  )}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </PageShell>
  );
}
