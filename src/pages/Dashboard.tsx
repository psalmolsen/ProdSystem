import { useState, useEffect, useMemo, useCallback } from "react";
import { ClipboardList, Plus, Zap, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { ProductionLanes } from "@/components/tracker/production-lanes";
import type { StepSelection } from "@/components/tracker/production-lanes";
import { NewJobOrderForm } from "@/components/tracker/new-job-order-form";
import { FLAT_STEPS, STATIONS } from "@/config/stations";
import type { Bottleneck } from "@/types/tracker";
import type { JobOrder } from "@/types/jobOrder";
import { createJobOrder, getAllJobOrders } from "@/services/firestore/jobOrderService";
import { getJobOrderProductionStepTotals } from "@/services/firestore/productionService";
import { todayIsoDate } from "@/utils/date";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tabular tracking-[-0.02em] text-[#1D1D1F]">
        {value}
      </p>
    </div>
  );
}

const SHIFT_OPTIONS = [
  { value: "All", label: "All Shift Slots" },
  { value: "6-8", label: "6:00 AM – 8:00 AM" },
  { value: "8-10", label: "8:00 AM – 10:00 AM" },
  { value: "11-1", label: "11:00 AM – 1:00 PM" },
  { value: "1-3", label: "1:00 PM – 3:00 PM" },
  { value: "3-5", label: "3:00 PM – 5:00 PM" },
];

export function Dashboard() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [selectedJobOrderId, setSelectedJobOrderId] = useState<string | null>(null);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingTotals, setLoadingTotals] = useState(false);

  // Date and Shift Slot Filter state
  const [filterDate, setFilterDate] = useState<string>(todayIsoDate());
  const [filterSlot, setFilterSlot] = useState<string>("All");

  const [selectedStep, setSelectedStep] = useState<StepSelection | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);

  // Job Order Pagination Index
  const currentJoIndex = useMemo(
    () => jobOrders.findIndex((jo) => jo.id === selectedJobOrderId),
    [jobOrders, selectedJobOrderId],
  );

  const handlePrevJobOrder = () => {
    if (jobOrders.length === 0) return;
    const prevIdx = currentJoIndex <= 0 ? jobOrders.length - 1 : currentJoIndex - 1;
    setSelectedJobOrderId(jobOrders[prevIdx].id);
    setSelectedStep(null);
  };

  const handleNextJobOrder = () => {
    if (jobOrders.length === 0) return;
    const nextIdx = currentJoIndex >= jobOrders.length - 1 ? 0 : currentJoIndex + 1;
    setSelectedJobOrderId(jobOrders[nextIdx].id);
    setSelectedStep(null);
  };

  // Date Prev / Next helpers
  const handlePrevDate = () => {
    const d = new Date(filterDate);
    d.setDate(d.getDate() - 1);
    setFilterDate(d.toISOString().slice(0, 10));
  };

  const handleNextDate = () => {
    const d = new Date(filterDate);
    d.setDate(d.getDate() + 1);
    setFilterDate(d.toISOString().slice(0, 10));
  };

  // 1. Fetch Job Orders list from Firestore
  const loadJobOrders = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await getAllJobOrders();
      setJobOrders(orders);
      if (orders.length > 0 && !selectedJobOrderId) {
        setSelectedJobOrderId(orders[0].id);
      }
    } catch (err) {
      console.error("Failed to load Job Orders from Firestore:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedJobOrderId]);

  useEffect(() => {
    loadJobOrders();
  }, [loadJobOrders]);

  // 2. Fetch step totals from Cloud Firestore with Date & Shift filters
  const loadStepTotals = useCallback(async () => {
    if (!selectedJobOrderId) {
      setTotals({});
      return;
    }
    setLoadingTotals(true);
    try {
      const stepTotals = await getJobOrderProductionStepTotals(selectedJobOrderId, {
        dateStr: filterDate,
        timeSlot: filterSlot,
      });
      setTotals(stepTotals);
    } catch (err) {
      console.error("Failed to load production step totals from Firestore:", err);
    } finally {
      setLoadingTotals(false);
    }
  }, [selectedJobOrderId, filterDate, filterSlot]);

  useEffect(() => {
    loadStepTotals();
  }, [loadStepTotals]);

  const selectedJobOrder = useMemo(
    () => jobOrders.find((order) => order.id === selectedJobOrderId) ?? null,
    [jobOrders, selectedJobOrderId],
  );

  // Derive Busiest Step (Overload) from filtered Firestore totals
  const overload = useMemo<Bottleneck | null>(() => {
    let best: Bottleneck | null = null;
    for (const step of FLAT_STEPS) {
      const total = totals[step.key] ?? 0;
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
  }, [totals]);

  // Calculate high-level stats for filtered view
  const orderTotal = useMemo(
    () => Object.values(totals).reduce((sum, v) => sum + v, 0),
    [totals],
  );
  const goodTotal = totals["Cosmetics::Good"] ?? 0;

  const toggleStep = (selection: StepSelection) => {
    if (selectedStep?.key === selection.key) {
      setSelectedStep(null);
    } else {
      setSelectedStep(selection);
    }
  };

  const handleOrderChange = (id: string) => {
    setSelectedJobOrderId(id);
    setSelectedStep(null);
  };

  const handleNewOrder = async (workOrderNumber: string, brandName: string) => {
    try {
      const created = await createJobOrder({
        workOrder: workOrderNumber,
        brand: brandName,
        status: "Active",
      });
      setShowNewOrder(false);
      await loadJobOrders();
      setSelectedJobOrderId(created.id);
    } catch (err) {
      console.error("Failed to create Job Order in Firestore:", err);
    }
  };

  return (
    <PageShell title="Production Tracker" breadcrumb={["CCB", "Production", "Flow"]}>
      {/* ── Job order selector card with Job Order Pagination ────────────────── */}
      <section className="rounded-[16px] border border-[#D2D2D7] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="min-w-[280px] flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="job-order" className="text-[12px] font-medium text-[#1D1D1F]">
                Job order
              </label>

              {/* Job Order Pagination Badge & Control Arrows */}
              {jobOrders.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-[#6E6E73]">
                    {currentJoIndex >= 0 ? currentJoIndex + 1 : 0} of {jobOrders.length}
                  </span>
                  <button
                    type="button"
                    onClick={handlePrevJobOrder}
                    title="Previous Job Order"
                    className="grid h-6 w-6 place-items-center rounded-[6px] border border-[#D2D2D7] bg-[#F5F5F7] hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextJobOrder}
                    title="Next Job Order"
                    className="grid h-6 w-6 place-items-center rounded-[6px] border border-[#D2D2D7] bg-[#F5F5F7] hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <select
              id="job-order"
              value={selectedJobOrderId ?? ""}
              onChange={(e) => handleOrderChange(e.target.value)}
              className="input-field font-medium"
            >
              {loading ? (
                <option value="">Loading Job Orders from Firestore...</option>
              ) : jobOrders.length === 0 ? (
                <option value="">No Job Orders found</option>
              ) : (
                jobOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.workOrder} · {order.brand} ({order.id})
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={loadStepTotals}
            className="btn-secondary"
            title="Refresh Firestore totals"
          >
            <RefreshCw className={`h-4 w-4 ${loadingTotals ? "animate-spin" : ""}`} strokeWidth={1.5} />
            Sync
          </button>

          <button
            type="button"
            onClick={() => setShowNewOrder((v) => !v)}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            New order
          </button>

          {/* Standalone "Log Entry" button */}
          {selectedJobOrder && (
            <a href="#/entry" className="btn-primary">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Log entry
            </a>
          )}

          <div className="flex items-center gap-6 border-l border-[#D2D2D7] pl-6">
            <Stat label="Filtered Output" value={orderTotal} />
            <div>
              <p className="eyebrow text-[#34C759]">Finished Good</p>
              <p className="mt-1 text-[22px] font-bold tabular tracking-[-0.02em] text-[#34C759]">
                {goodTotal}
              </p>
            </div>
          </div>
        </div>

        {showNewOrder && (
          <div className="mt-6 border-t border-[#D2D2D7] pt-6">
            <NewJobOrderForm
              onSubmit={handleNewOrder}
              onCancel={() => setShowNewOrder(false)}
            />
          </div>
        )}
      </section>

      {/* ── Overload banner ──────────────────────────────────────────────── */}
      {overload && (
        <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-[#ff9f0a]/30 bg-[#ff9f0a]/08 px-4 py-3">
          <Zap className="h-4 w-4 shrink-0 text-[#ff9f0a]" fill="currentColor" />
          <p className="text-[13px] text-[#1D1D1F]">
            Busiest step:{" "}
            <span className="font-semibold">
              {overload.station} / {overload.subProcess}
            </span>
            <span className="text-[#6E6E73]"> ({overload.total} units)</span>
          </p>
        </div>
      )}

      {/* ── Production flow visual representation card with Date & Shift Header ── */}
      <section className="mt-4 rounded-[16px] border border-[#D2D2D7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D2D2D7] px-6 py-4">
          {/* Left Title */}
          <div className="min-w-[200px]">
            <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
              {selectedJobOrder
                ? `${selectedJobOrder.workOrder} · ${selectedJobOrder.brand}`
                : "No job order selected"}
            </h2>
            <p className="mt-0.5 text-[12px] text-[#6E6E73]">
              Serpentine flow visual representation
            </p>
          </div>

          {/* Right Header Filter Toolbar: < Date > & Shift Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Navigator Controls: < date > */}
            <div className="flex items-center gap-1 rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] p-1">
              <button
                type="button"
                onClick={handlePrevDate}
                title="Previous Day"
                className="grid h-8 w-8 place-items-center rounded-[8px] hover:bg-white hover:text-[#0071E3] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-8 border-0 bg-transparent px-2 text-[13px] font-semibold text-[#1D1D1F] outline-none cursor-pointer"
              />

              <button
                type="button"
                onClick={handleNextDate}
                title="Next Day"
                className="grid h-8 w-8 place-items-center rounded-[8px] hover:bg-white hover:text-[#0071E3] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Shift Time Dropdown */}
            <select
              value={filterSlot}
              onChange={(e) => setFilterSlot(e.target.value)}
              className="h-10 rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] px-3 text-[13px] font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
            >
              {SHIFT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="px-4 py-6">
          {selectedJobOrder ? (
            <ProductionLanes
              totals={totals}
              goodTotals={totals}
              overload={overload}
              selected={selectedStep}
              onSelectStep={toggleStep}
            />
          ) : (
            <div className="grid min-h-[280px] place-items-center px-6 py-10 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-[16px] bg-[rgba(0,113,227,0.08)]">
                  <ClipboardList className="h-6 w-6 text-[#0071E3]" strokeWidth={1.5} />
                </span>
                <p className="mt-5 text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
                  No job order selected
                </p>
                <p className="mt-2 text-[13px] leading-[1.5] text-[#6E6E73]">
                  Pick a job order from the dropdown above, or create a new one to start
                  tracking output across the production flow.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewOrder(true)}
                  className="btn-primary mt-6"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.5} />
                  Create job order
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
