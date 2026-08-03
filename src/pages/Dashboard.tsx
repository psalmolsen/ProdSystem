import { useMemo, useState } from "react";
import { ClipboardList, Plus, Zap } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { ProductionLanes } from "@/components/tracker/production-lanes";
import type { StepSelection } from "@/components/tracker/production-lanes";
import { EntryPanel } from "@/components/tracker/entry-panel";
import { NewJobOrderForm } from "@/components/tracker/new-job-order-form";
import { STATIONS } from "@/config/stations";
import type { TimeSlot } from "@/config/stations";
import { useTracker } from "@/hooks/useTracker";
import {
  getJobOrderTotal,
  getRecentPersonnel,
  getSubProcessEntries,
  getTodayTotal,
} from "@/services/trackerService";
import type { StationId } from "@/types/tracker";

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

export function Dashboard() {
  const {
    jobOrders,
    selectedJobOrderId,
    setSelectedJobOrderId,
    totals,
    overload,
    addEntry,
    addJobOrder,
  } = useTracker();

  const [selectedStep, setSelectedStep]   = useState<StepSelection | null>(null);
  const [showNewOrder, setShowNewOrder]   = useState(false);
  /** null = panel closed; "free" = open in free-select mode */
  const [panelMode, setPanelMode]         = useState<"step" | "free" | null>(null);

  const selectedJobOrder =
    jobOrders.find((order) => order.id === selectedJobOrderId) ?? null;

  // Entries + totals for the currently selected flow-map step
  const stepEntries = useMemo(
    () =>
      selectedJobOrderId && selectedStep
        ? getSubProcessEntries(
            selectedJobOrderId,
            selectedStep.station,
            selectedStep.subProcess,
          )
        : [],
    [selectedJobOrderId, selectedStep, totals],
  );
  const stepTotal = selectedStep ? (totals[selectedStep.key] ?? 0) : 0;
  const recentPersonnel = useMemo(
    () =>
      selectedJobOrderId && selectedStep
        ? getRecentPersonnel(
            selectedJobOrderId,
            selectedStep.station,
            selectedStep.subProcess,
          )
        : [],
    [selectedJobOrderId, selectedStep, totals],
  );

  const todayTotal  = selectedJobOrderId ? getTodayTotal(selectedJobOrderId)     : 0;
  const orderTotal  = selectedJobOrderId ? getJobOrderTotal(selectedJobOrderId)  : 0;

  const toggleStep = (selection: StepSelection) => {
    if (selectedStep?.key === selection.key) {
      setSelectedStep(null);
      setPanelMode(null);
    } else {
      setSelectedStep(selection);
      setPanelMode("step");
    }
  };

  const handleOrderChange = (id: string) => {
    setSelectedJobOrderId(id);
    setSelectedStep(null);
    setPanelMode(null);
  };

  const handleAddEntry = (input: {
    station: StationId;
    subProcess: string;
    personnelName: string;
    output: number;
    timeSlot: TimeSlot;
    entryDate: string;
  }) => {
    if (!selectedJobOrderId) return;
    addEntry({ ...input, jobOrderId: selectedJobOrderId });
  };

  const handleNewOrder = (workOrderNumber: string, brandName: string) => {
    addJobOrder(workOrderNumber, brandName);
    setShowNewOrder(false);
  };

  const closePanel = () => {
    setSelectedStep(null);
    setPanelMode(null);
  };

  const panelOpen    = panelMode !== null;
  const panelStation = panelMode === "step" ? (selectedStep?.station ?? null) : null;
  const panelProcess = panelMode === "step" ? (selectedStep?.subProcess ?? null) : null;

  return (
    <PageShell title="Production Tracker" breadcrumb={["CCB", "Production", "Flow"]}>

      {/* ── Job order selector card ──────────────────────────────────────── */}
      <section className="rounded-[16px] border border-[#D2D2D7] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="job-order" className="mb-1.5 block text-[12px] font-medium text-[#1D1D1F]">
              Job order
            </label>
            <select
              id="job-order"
              value={selectedJobOrderId ?? ""}
              onChange={(e) => handleOrderChange(e.target.value)}
              className="input-field font-medium"
            >
              {jobOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.workOrderNumber} · {order.brandName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowNewOrder((v) => !v)}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            New order
          </button>

          {/* Standalone "Log Entry" button — opens free-select panel */}
          {selectedJobOrder && (
            <button
              type="button"
              onClick={() => {
                setSelectedStep(null);
                setPanelMode("free");
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Log entry
            </button>
          )}

          <div className="flex items-center gap-8">
            <Stat label="Logged today" value={todayTotal} />
            <Stat label="Order total"  value={orderTotal} />
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

      {/* ── Production flow card ─────────────────────────────────────────── */}
      <section className="mt-4 rounded-[16px] border border-[#D2D2D7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D2D2D7] px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
              {selectedJobOrder
                ? `${selectedJobOrder.workOrderNumber} · ${selectedJobOrder.brandName}`
                : "No job order"}
            </h2>
            <p className="mt-1 text-[13px] text-[#6E6E73]">
              Serpentine flow encodes output volume · click a step to log output
            </p>
          </div>
          <span className="rounded-[10px] bg-[#F5F5F7] px-2.5 py-1.5 text-[11px] font-medium text-[#6E6E73] tabular">
            {STATIONS.length} stations ·{" "}
            {STATIONS.reduce((n, s) => n + s.subProcesses.length, 0)} steps
          </span>
        </header>

        <div className="px-4 py-6">
          {selectedJobOrder ? (
            <ProductionLanes
              totals={totals}
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

      {/* ── Entry panel (step-locked or free-select) ─────────────────────── */}
      {panelOpen && selectedJobOrderId && (
        <div className="mt-4">
          <EntryPanel
            jobOrderId={selectedJobOrderId}
            station={panelStation}
            subProcess={panelProcess}
            total={stepTotal}
            entries={stepEntries}
            recentPersonnel={recentPersonnel}
            onAddEntry={handleAddEntry}
            onClose={closePanel}
          />
        </div>
      )}
    </PageShell>
  );
}
