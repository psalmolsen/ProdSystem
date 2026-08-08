import { useState, useEffect, useMemo, useCallback } from "react";
import { ClipboardList, Plus, Zap, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, X, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { ProductionLanes } from "@/components/tracker/production-lanes";
import type { StepSelection } from "@/components/tracker/production-lanes";
import { NewJobOrderForm } from "@/components/tracker/new-job-order-form";
import { FLAT_STEPS } from "@/config/stations";
import type { Bottleneck } from "@/types/tracker";
import type { JobOrder } from "@/types/jobOrder";
import { createJobOrder, getAllJobOrders } from "@/services/firestore/jobOrderService";
import { getJobOrderProductionStepTotals } from "@/services/firestore/productionService";
import { todayIsoDate } from "@/utils/date";
import { cn } from "@/lib/utils";

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
  const [filterSlot, setFilterSlot] = useState<string>("6-8");

  const [selectedStep, setSelectedStep] = useState<StepSelection | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);

  // Log Entry Confirmation Modal State
  const [isLogEntryModalOpen, setIsLogEntryModalOpen] = useState(false);
  const [modalSelectedJoId, setModalSelectedJoId] = useState<string>("");

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

  // Calculate target total quantity for selected Job Order
  const targetTotal = useMemo(() => {
    if (!selectedJobOrder) return 0;
    const size11 = Number(selectedJobOrder.size11kg || 0);
    const size22 = Number(selectedJobOrder.size22kg || 0);
    const size50 = Number(selectedJobOrder.size50kg || 0);
    const variantSum = size11 + size22 + size50;
    const cnf = Number(selectedJobOrder.cnf || 0);
    const cf = Number(selectedJobOrder.cf || 0);
    const cn = Number(selectedJobOrder.cn || selectedJobOrder.c || 0);
    const othersSum = selectedJobOrder.otherItems
      ? selectedJobOrder.otherItems.reduce((acc, item) => acc + Number(item.qty || 0), 0)
      : 0;
    return variantSum > 0 ? variantSum : (cnf + cf + cn + othersSum);
  }, [selectedJobOrder]);

  const completionPercent = useMemo(() => {
    if (targetTotal <= 0) return 0;
    return Math.min(100, Math.round((goodTotal / targetTotal) * 100));
  }, [goodTotal, targetTotal]);

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
      const rawJo = workOrderNumber.trim();
      const cleanJoNum = rawJo.toUpperCase().replace(/^(JO|WO)-?/, "");
      const created = await createJobOrder({
        joNumber: cleanJoNum || rawJo,
        workOrder: `WO-${cleanJoNum || rawJo}`,
        brand: brandName.trim() || "Standard",
        status: "Active",
      });
      setShowNewOrder(false);
      await loadJobOrders();
      setSelectedJobOrderId(created.id);
    } catch (err) {
      console.error("Failed to create Job Order in Firestore:", err);
    }
  };

  const openLogEntryModal = () => {
    setModalSelectedJoId(selectedJobOrderId || (jobOrders[0]?.id ?? ""));
    setIsLogEntryModalOpen(true);
  };

  const handleConfirmLogEntry = () => {
    if (modalSelectedJoId) {
      sessionStorage.setItem("activeMonitoringJoId", modalSelectedJoId);
    }
    setIsLogEntryModalOpen(false);
    window.location.hash = "#/entry";
  };

  return (
    <PageShell title="Production Monitoring Dashboard" breadcrumb={["CCB System", "Live Tracking", "Dashboard"]}>
      {/* ── Dashboard Widescreen Layout: Visual JO Flow (Left 75%) + 4 KPI Cards (Right 25%) ── */}
      <div className="mt-4 grid grid-cols-1 gap-6 items-start lg:grid-cols-12">
        {/* ── Left Main Column: Visual JO Flow Canvas (Generous Wide Size) ─────────── */}
        <div className="space-y-4 lg:col-span-8 xl:col-span-9">
          {showNewOrder && (
            <section className="rounded-[16px] border border-[#D2D2D7] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
              <NewJobOrderForm
                onSubmit={handleNewOrder}
                onCancel={() => setShowNewOrder(false)}
              />
            </section>
          )}

          {/* Overload banner */}
          {overload && (
            <div className="flex items-center gap-2.5 rounded-[12px] border border-[#ff9f0a]/30 bg-[#ff9f0a]/08 px-4 py-3">
              <Zap className="h-4 w-4 shrink-0 text-[#ff9f0a]" fill="currentColor" />
              <p className="text-[13px] text-[#1D1D1F]">
                Busiest step:{" "}
                <span className="font-semibold">
                  {overload.station} / {overload.subProcess}
                </span>
                <span className="text-[#6E6E73]"> ({overload.total} cyl)</span>
              </p>
            </div>
          )}

          <section className="w-full rounded-[16px] border border-[#D2D2D7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D2D2D7] px-6 py-4">
              {/* Left Title */}
              <div>
                <h2 className="text-[24px] font-black tracking-tight text-[#1D1D1F] flex items-center gap-2.5">
                  <span>JO # {selectedJobOrder ? selectedJobOrder.id.replace(/^JO-/, "") : "___"}</span>
                  {selectedJobOrder && (
                    <span className="rounded-full bg-[#0071E3]/10 border border-[#0071E3]/20 px-3 py-0.5 text-[12px] font-bold text-[#0071E3]">
                      {selectedJobOrder.cylinderSize || "11 kg"}
                    </span>
                  )}
                </h2>
              </div>

              {/* Right Header Filter Toolbar: < Date > & Shift Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Date Navigator Controls: < date > */}
                <div className="flex items-center gap-1 rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] p-1">
                  <button
                    type="button"
                    onClick={handlePrevDate}
                    title="Previous Day"
                    className="grid h-8 w-8 place-items-center rounded-[8px] hover:bg-white hover:text-[#0071E3] transition-colors cursor-pointer"
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
                    className="grid h-8 w-8 place-items-center rounded-[8px] hover:bg-white hover:text-[#0071E3] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Shift Time Dropdown */}
                <select
                  value={filterSlot}
                  onChange={(e) => setFilterSlot(e.target.value)}
                  className="h-10 rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] px-3 text-[13px] font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 cursor-pointer"
                >
                  {SHIFT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </header>

            <div className="px-6 py-8">
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
                      No Job Order Selected
                    </p>
                    <p className="mt-2 text-[13px] leading-[1.5] text-[#6E6E73]">
                      Pick a Job Order from the cards on the right, or create a new one to start
                      tracking output across the production flow.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowNewOrder(true)}
                      className="btn-primary mt-6"
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.5} />
                      Create Job Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Right Sidebar: KPI Cards & Standalone Log Productivity Action ────── */}
        <div className="space-y-3.5 lg:col-span-4 xl:col-span-3">
          {/* Standalone Primary Action Button */}
          <button
            type="button"
            onClick={openLogEntryModal}
            className="btn-primary h-11 w-full text-[14px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(0,113,227,0.28)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.38)] transition-all rounded-[14px]"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2} />
            <span>Log Productivity</span>
          </button>

          {/* Card 1: Job Order List */}
          <div className="flex flex-col justify-between rounded-[16px] border border-[#D2D2D7] bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                  Job Order List
                </span>
              </div>

              <select
                id="job-order"
                value={selectedJobOrderId ?? ""}
                onChange={(e) => handleOrderChange(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#D2D2D7] bg-white px-3 text-[13px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3] cursor-pointer"
              >
                {loading ? (
                  <option value="">Loading Job Orders...</option>
                ) : jobOrders.length === 0 ? (
                  <option value="">No Job Orders found</option>
                ) : (
                  jobOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.id}{order.brand && order.brand !== "Standard" && order.brand !== "Standard Brand" ? ` — ${order.brand}` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Card 2: Work Orders */}
          <div className="flex flex-col justify-between rounded-[16px] border border-[#D2D2D7] bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                  Work Orders
                </span>
                <span className="rounded-full bg-[rgba(0,113,227,0.10)] px-2.5 py-0.5 text-[11px] font-extrabold text-[#0071E3]">
                  Total Cyl: {targetTotal}
                </span>
              </div>

              {selectedJobOrder ? (
                <div className="text-[12px] font-medium text-[#1D1D1F] space-y-2">
                  {/* Nested Breakdown per Tank Capacity */}
                  {(() => {
                    const v11 = selectedJobOrder.variants?.size11kg;
                    const v22 = selectedJobOrder.variants?.size22kg;
                    const v50 = selectedJobOrder.variants?.size50kg;
                    const hasVariants = Boolean(v11 || v22 || v50);

                    if (!hasVariants) {
                      return (
                        <div className="rounded-lg bg-[#F5F5F7] p-2 border border-[#E5E5EA]">
                          <span className="font-bold text-[#0071E3] block text-[11px] mb-0.5">11 kg Variant</span>
                          <span className="text-[12px] font-semibold text-[#1D1D1F]">
                            CNF: {selectedJobOrder.cnf || 0} · CF: {selectedJobOrder.cf || 0} · CN: {selectedJobOrder.cn || selectedJobOrder.c || 0}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1.5">
                        {v11 && (Number(v11.cnf || 0) > 0 || Number(v11.cf || 0) > 0 || Number(v11.cn || 0) > 0) && (
                          <div className="rounded-lg bg-[#F5F5F7] p-2 border border-[#E5E5EA]">
                            <span className="font-bold text-[#0071E3] block text-[11px] mb-0.5">11 kg Variant</span>
                            <span className="text-[12px] font-semibold text-[#1D1D1F]">
                              CNF: {v11.cnf || 0} · CF: {v11.cf || 0} · CN: {v11.cn || 0}
                            </span>
                          </div>
                        )}
                        {v22 && (Number(v22.cnf || 0) > 0 || Number(v22.cf || 0) > 0 || Number(v22.cn || 0) > 0) && (
                          <div className="rounded-lg bg-[#F5F5F7] p-2 border border-[#E5E5EA]">
                            <span className="font-bold text-[#0071E3] block text-[11px] mb-0.5">22 kg Variant</span>
                            <span className="text-[12px] font-semibold text-[#1D1D1F]">
                              CNF: {v22.cnf || 0} · CF: {v22.cf || 0} · CN: {v22.cn || 0}
                            </span>
                          </div>
                        )}
                        {v50 && (Number(v50.cnf || 0) > 0 || Number(v50.cf || 0) > 0 || Number(v50.cn || 0) > 0) && (
                          <div className="rounded-lg bg-[#F5F5F7] p-2 border border-[#E5E5EA]">
                            <span className="font-bold text-[#0071E3] block text-[11px] mb-0.5">50 kg Variant</span>
                            <span className="text-[12px] font-semibold text-[#1D1D1F]">
                              CNF: {v50.cnf || 0} · CF: {v50.cf || 0} · CN: {v50.cn || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {selectedJobOrder.otherItems && selectedJobOrder.otherItems.length > 0 && (
                    <p className="text-[11px] text-[#6E6E73] truncate pt-1 border-t border-[#E5E5EA]">
                      Others: {selectedJobOrder.otherItems.map((i) => `${i.label}: ${i.qty}`).join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-[#6E6E73]">No order selected</p>
              )}
            </div>
          </div>

          {/* Card 3: Completion Progress */}
          <div className="flex flex-col justify-between rounded-[16px] border border-[#D2D2D7] bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                  Completion Rate
                </span>
                <span className="text-[18px] font-bold tabular tracking-tight text-[#0071E3]">
                  {completionPercent}%
                </span>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5E5EA]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0071E3] to-[#34C759] transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-medium text-[#6E6E73]">
                <strong>{goodTotal}</strong> of <strong>{targetTotal}</strong> finished cyl
              </p>
            </div>
          </div>

          {/* Card 4: Buffer & Rejects Storage */}
          <div className="flex flex-col justify-between rounded-[16px] border border-[#D2D2D7] bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                  Buffer & Rejects
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] p-2.5 text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Buffer
                  </span>
                  <span className="text-[20px] font-bold tabular tracking-tight text-[#1D1D1F]">
                    {(totals["Others::Buffer"] ?? 0) + (totals["Cosmetics::Buffer"] ?? 0)}
                  </span>
                  <span className="block text-[9px] text-[#6E6E73] font-semibold">cylinders</span>
                </div>

                <div className="rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] p-2.5 text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Reject
                  </span>
                  <span className="text-[20px] font-bold tabular tracking-tight text-[#1D1D1F]">
                    {(totals["Others::Reject"] ?? 0) + (totals["Cosmetics::Reject"] ?? 0)}
                  </span>
                  <span className="block text-[9px] text-[#6E6E73] font-semibold">cylinders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Job Order Modal for Log Entry ─────────────────────────── */}
      {isLogEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl border border-[#D2D2D7]">
            <div className="flex items-center justify-between border-b border-[#D2D2D7] pb-4">
              <div>
                <h3 className="text-[18px] font-bold text-[#1D1D1F]">
                  Confirm Job Order for Monitoring
                </h3>
                <p className="mt-1 text-[13px] text-[#6E6E73]">
                  Select which Job Order saved in the database is about to have production monitoring.
                </p>
              </div>
              <button
                onClick={() => setIsLogEntryModalOpen(false)}
                className="rounded-full p-1 text-[#6E6E73] hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {jobOrders.length === 0 ? (
                <div className="p-6 text-center text-[#6E6E73] text-[13px]">
                  No Job Orders found in database. Please create a Job Order first.
                </div>
              ) : (
                jobOrders.map((jo) => {
                  const isSelected = modalSelectedJoId === jo.id;
                  return (
                    <div
                      key={jo.id}
                      onClick={() => setModalSelectedJoId(jo.id)}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-[12px] border transition-all cursor-pointer",
                        isSelected
                          ? "border-[#0071E3] bg-[#0071E3]/5 ring-2 ring-[#0071E3]/20"
                          : "border-[#D2D2D7] bg-white hover:border-[#0071E3]/50 hover:bg-[#F5F5F7]",
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[14px] text-[#0071E3]">{jo.id}</span>
                          {jo.brand && jo.brand !== "Standard" && jo.brand !== "Standard Brand" && (
                            <span className="font-semibold text-[13px] text-[#1D1D1F]">
                              — {jo.brand}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#6E6E73]">
                          <span>CNF: <strong className="text-[#1D1D1F]">{jo.cnf ?? 0}</strong></span>
                          <span>CF: <strong className="text-[#1D1D1F]">{jo.cf ?? 0}</strong></span>
                          <span>CN: <strong className="text-[#1D1D1F]">{jo.cn ?? jo.c ?? 0}</strong></span>
                          {jo.otherItems && jo.otherItems.length > 0 && (
                            <span>Others: <strong className="text-[#1D1D1F]">{jo.otherItems.map(i => `${i.label}:${i.qty}`).join(", ")}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pl-3">
                        {isSelected ? (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0071E3] text-white">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-[#D2D2D7]" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D2D2D7] mt-4">
              <button
                type="button"
                onClick={() => setIsLogEntryModalOpen(false)}
                className="rounded-[10px] border border-[#D2D2D7] px-4 py-2 text-[13px] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogEntry}
                disabled={!modalSelectedJoId}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#0071E3] px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#005bb5] disabled:opacity-50 cursor-pointer"
              >
                <span>Confirm & Start Monitoring</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
