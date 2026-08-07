import { Fragment } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import { STATIONS, stepKey } from "@/config/stations";
import type { Bottleneck, StationConfig, StationId } from "@/types/tracker";
import { cn } from "@/lib/utils";

export interface StepSelection {
  station: StationId;
  subProcess: string;
  key: string;
}

type Direction = StationConfig["direction"];

const primaryMix = (pct: number, base: string): string =>
  `color-mix(in srgb, var(--color-primary) ${pct}%, ${base})`;

const connectorColor = (intensity: number, active: boolean): string =>
  active
    ? primaryMix(Math.round(30 + 70 * intensity), "var(--color-border)")
    : "var(--color-border)";

const connectorThickness = (intensity: number, active: boolean): number =>
  active ? 2 + 5 * intensity : 2;

function FlowNode({
  label,
  total,
  intensity,
  selected,
  bottleneck,
  isFinalStep,
  onClick,
}: {
  label: string;
  total: number;
  intensity: number;
  selected: boolean;
  bottleneck: boolean;
  isFinalStep?: boolean;
  onClick: () => void;
}) {
  const empty = total <= 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={`${label} \u00b7 ${total} units`}
      className={cn(
        "relative flex min-h-[76px] min-w-0 flex-1 flex-col justify-between gap-2 overflow-hidden rounded-[12px] border px-3 py-3 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1",
        isFinalStep ? "bg-[rgba(52,199,89,0.08)] border-[rgba(52,199,89,0.30)]" : "bg-[rgba(0,113,227,0.06)] border-[rgba(0,113,227,0.16)]",
        selected && "border-[#0071E3] ring-2 ring-[rgba(0,113,227,0.25)]",
        bottleneck && !selected && "trace-overload",
      )}
    >
      <span className="flex min-w-0 items-start justify-between gap-1.5">
        <span className="min-w-0 truncate text-[12px] font-medium leading-tight text-[#1D1D1F]">
          {label}
        </span>
        {bottleneck && (
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-[#ff9f0a]"
            strokeWidth={1.5}
          />
        )}
        {isFinalStep && (
          <span className="rounded-full bg-[#34C759] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
            GOOD
          </span>
        )}
      </span>
      <span
        className={cn(
          "text-[22px] font-semibold tabular leading-none tracking-[-0.02em] xl:text-[24px]",
          isFinalStep ? "text-[#28CD41]" : "text-[#1D1D1F]",
        )}
      >
        {empty ? "\u2014" : total}
      </span>
    </button>
  );
}

function HorizontalConnector({
  intensity,
  active,
  direction,
}: {
  intensity: number;
  active: boolean;
  direction: Direction;
}) {
  return (
    <span aria-hidden="true" className="flex w-6 shrink-0 items-center self-center xl:w-7">
      <span
        className="relative w-full overflow-hidden rounded-full"
        style={{
          height: connectorThickness(intensity, active),
          backgroundColor: connectorColor(intensity, active),
        }}
      >
        {active && (
          <span
            className="flow-glow"
            style={{
              animationName: direction === "ltr" ? "flow-glow-ltr" : "flow-glow-rtl",
            }}
          />
        )}
      </span>
    </span>
  );
}

function VerticalConnector({
  intensity,
  active,
  side,
}: {
  intensity: number;
  active: boolean;
  side: "left" | "right";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-[66px] pt-[32px]",
        side === "right" ? "pr-8" : "pl-8",
      )}
      style={{ justifyContent: side === "right" ? "flex-end" : "flex-start" }}
    >
      <span
        className="relative overflow-hidden rounded-full"
        style={{
          width: connectorThickness(intensity, active),
          height: 40,
          backgroundColor: connectorColor(intensity, active),
        }}
      >
        {active && (
          <span
            className="flow-glow"
            style={{
              animationName: "flow-glow-y",
              background:
                "linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.7), transparent)",
              width: "100%",
              height: "50%",
            }}
          />
        )}
      </span>
    </div>
  );
}

const STATION_LABELS: Record<StationId, string> = {
  CTC1: "CTC 1 · Testing & Cleaning",
  CTC2: "CTC 2 · Valve Assembly & Pressure",
  Hotworks: "Hotworks · Welding & Refurbish",
  Painting: "Painting · Shotblast & Coating",
  Cosmetics: "Cosmetics · Inspection & Weighing",
};

function StationRow({
  station,
  index,
  isLast,
  totals,
  maxTotal,
  overload,
  selected,
  onSelectStep,
}: {
  station: StationConfig;
  index: number;
  isLast: boolean;
  totals: Record<string, number>;
  maxTotal: number;
  overload: Bottleneck | null;
  selected: StepSelection | null;
  onSelectStep: (selection: StepSelection) => void;
}) {
  // Exclude "Good" from the Cosmetics line so it can be rendered on its own independent line
  const subProcesses = station.subProcesses.filter((sp) => sp !== "Good");
  const display =
    station.direction === "rtl" ? [...subProcesses].reverse() : subProcesses;
  const nodeTotals = display.map((sp) => totals[stepKey(station.id, sp)] ?? 0);

  const exitIndex = station.direction === "ltr" ? display.length - 1 : 0;
  const exitTotal = nodeTotals[exitIndex];
  const exitIntensity = maxTotal > 0 ? exitTotal / maxTotal : 0;
  const exitSide = station.direction === "ltr" ? "right" : "left";

  const DirectionIcon = station.direction === "ltr" ? ArrowRight : ArrowLeft;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-center gap-2">
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[rgba(0,113,227,0.10)] px-1.5 text-[11px] font-bold tabular text-[#0071E3]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-[12px] font-bold tracking-tight text-[#1D1D1F] uppercase">
          {STATION_LABELS[station.id] || station.id}
        </h3>
        <DirectionIcon
          className="h-4 w-4 text-[#0071E3]/60"
          strokeWidth={1.75}
        />
      </div>

      <div className="flex items-stretch gap-2 xl:gap-2.5">
        {display.map((subProcess, j) => {
          const key = stepKey(station.id, subProcess);
          const total = nodeTotals[j];
          const intensity = maxTotal > 0 ? total / maxTotal : 0;
          const sourceIdx = station.direction === "ltr" ? j - 1 : j;
          return (
            <Fragment key={subProcess}>
              {j > 0 && (
                <HorizontalConnector
                  intensity={maxTotal > 0 ? nodeTotals[sourceIdx] / maxTotal : 0}
                  active={nodeTotals[sourceIdx] > 0}
                  direction={station.direction}
                />
              )}
              <FlowNode
                label={subProcess}
                total={total}
                intensity={intensity}
                selected={selected?.key === key}
                bottleneck={overload?.key === key}
                onClick={() => onSelectStep({ station: station.id, subProcess, key })}
              />
            </Fragment>
          );
        })}
      </div>

      {/* Render vertical connector to the next station or to the independent GOOD line */}
      <VerticalConnector
        intensity={exitIntensity}
        active={exitTotal > 0}
        side={exitSide}
      />
    </div>
  );
}

export function ProductionLanes({
  totals,
  overload,
  selected,
  onSelectStep,
}: {
  totals: Record<string, number>;
  goodTotals?: Record<string, number>;
  overload: Bottleneck | null;
  selected: StepSelection | null;
  onSelectStep: (selection: StepSelection) => void;
}) {
  const maxTotal = Math.max(0, ...Object.values(totals));
  const goodTotal = totals["Cosmetics::Good"] ?? 0;
  const goodKey = stepKey("Cosmetics", "Good");
  const goodSelected = selected?.key === goodKey;

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="min-w-[600px] px-6 xl:px-12">
        <div className="space-y-2.5">
          {STATIONS.map((station, i) => (
            <StationRow
              key={station.id}
              station={station}
              index={i}
              isLast={i === STATIONS.length - 1}
              totals={totals}
              maxTotal={maxTotal}
              overload={overload}
              selected={selected}
              onSelectStep={onSelectStep}
            />
          ))}

          {/* ── Independent 6th Line: GOOD ──────────────────────────────────── */}
          <div className="mt-1">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[rgba(52,199,89,0.15)] px-1 text-[10px] font-bold tabular text-[#34C759]">
                06
              </span>
              <h3 className="eyebrow text-[#34C759]">GOOD</h3>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() =>
                  onSelectStep({
                    station: "Cosmetics",
                    subProcess: "Good",
                    key: goodKey,
                  })
                }
                aria-pressed={goodSelected}
                className={cn(
                  "relative flex w-[240px] min-h-[80px] flex-col justify-between rounded-[14px] border border-[rgba(52,199,89,0.35)] bg-[rgba(52,199,89,0.08)] p-3.5 text-left shadow-[0_4px_16px_rgba(52,199,89,0.10)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(52,199,89,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34C759]",
                  goodSelected && "border-[#34C759] ring-2 ring-[rgba(52,199,89,0.30)]",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#1D1D1F]">Good Products</span>
                  <span className="rounded-full bg-[#34C759] px-2 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider">
                    COMPLETED
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[11px] font-medium text-[#6E6E73]">Total Passed</span>
                  <span className="text-[26px] font-bold tabular leading-none text-[#34C759]">
                    {goodTotal <= 0 ? "\u2014" : goodTotal}
                  </span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
