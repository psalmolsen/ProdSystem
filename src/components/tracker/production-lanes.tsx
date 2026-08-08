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
    ? "rgba(0, 113, 227, 0.35)"
    : "rgba(0, 113, 227, 0.20)";

const connectorThickness = (intensity: number, active: boolean): number =>
  active ? 3.5 + 3.5 * intensity : 3;

function FlowNode({
  label,
  total,
  intensity,
  selected,
  bottleneck,
  onClick,
}: {
  label: string;
  total: number;
  intensity: number;
  selected: boolean;
  bottleneck: boolean;
  onClick: () => void;
}) {
  const empty = total <= 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={`${label} \u00b7 ${total} cyl`}
      className={cn(
        "relative flex min-h-[72px] min-w-0 flex-1 flex-col justify-between gap-1 overflow-hidden rounded-[10px] border border-[rgba(0,113,227,0.16)] bg-[rgba(0,113,227,0.06)] px-2 py-2 text-left shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1",
        selected && "border-[#0071E3] ring-2 ring-[rgba(0,113,227,0.25)]",
        bottleneck && !selected && "trace-overload",
      )}
    >
      <span className="flex min-w-0 items-start justify-between gap-0.5">
        <span className="min-w-0 text-[10px] sm:text-[11px] font-semibold leading-tight text-[#1D1D1F] break-words line-clamp-2">
          {label}
        </span>
        {bottleneck && (
          <AlertTriangle
            className="h-3.5 w-3.5 shrink-0 text-[#ff9f0a]"
            strokeWidth={1.5}
          />
        )}
      </span>
      <span className="text-[18px] sm:text-[20px] font-bold tabular leading-none tracking-[-0.02em] text-[#1D1D1F] xl:text-[22px]">
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
    <span aria-hidden="true" className="flex w-2 shrink-0 items-center self-center sm:w-2.5 md:w-3.5 xl:w-4.5">
      <span
        className="relative w-full overflow-hidden rounded-full shadow-[0_0_6px_rgba(0,113,227,0.30)]"
        style={{
          height: connectorThickness(intensity, active),
          backgroundColor: connectorColor(intensity, active),
        }}
      >
        <span
          className="flow-glow"
          style={{
            animationName: direction === "ltr" ? "flow-glow-ltr" : "flow-glow-rtl",
            background: "linear-gradient(90deg, transparent 0%, #0071E3 35%, #FFFFFF 50%, #0071E3 65%, transparent 100%)",
            filter: "drop-shadow(0 0 4px #0071E3)",
            opacity: active ? 1 : 0.85,
          }}
        />
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
        "flex h-[48px] pt-[20px]",
        side === "right" ? "pr-4 sm:pr-6" : "pl-4 sm:pl-6",
      )}
      style={{ justifyContent: side === "right" ? "flex-end" : "flex-start" }}
    >
      <span
        className="relative overflow-hidden rounded-full shadow-[0_0_6px_rgba(0,113,227,0.30)]"
        style={{
          width: connectorThickness(intensity, active),
          height: 28,
          backgroundColor: connectorColor(intensity, active),
        }}
      >
        <span
          className="flow-glow"
          style={{
            animationName: "flow-glow-y",
            background: "linear-gradient(180deg, transparent 0%, #0071E3 35%, #FFFFFF 50%, #0071E3 65%, transparent 100%)",
            filter: "drop-shadow(0 0 4px #0071E3)",
            width: "100%",
            height: "75%",
            opacity: active ? 1 : 0.85,
          }}
        />
      </span>
    </div>
  );
}

const STATION_LABELS: Record<StationId, string> = {
  CTC1: "CTC 1",
  CTC2: "CTC 2",
  Hotworks: "Hotworks",
  Painting: "Painting",
  Cosmetics: "Cosmetics",
  Others: "Others",
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
  // Exclude "Good", "Buffer", "Reject" from Cosmetics lane (Good is rendered on 6th line, Buffer/Reject in KPI sidebar & Others)
  const subProcesses = station.subProcesses.filter(
    (sp) => sp !== "Good" && sp !== "Buffer" && sp !== "Reject"
  );
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
      <div className="mb-2 flex items-center justify-center gap-1.5">
        <h3 className="text-[12px] font-bold tracking-tight text-[#1D1D1F] uppercase">
          {STATION_LABELS[station.id] || station.id}
        </h3>
        <DirectionIcon
          className="h-3.5 w-3.5 text-[#0071E3]/60"
          strokeWidth={1.75}
        />
      </div>

      <div className="flex items-stretch gap-1 sm:gap-1.5 md:gap-2">
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

      {/* Render vertical connector to the next station (omit after final station Cosmetics) */}
      {!isLast && (
        <VerticalConnector
          intensity={exitIntensity}
          active={exitTotal > 0}
          side={exitSide}
        />
      )}
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
    <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
      <div className="min-w-[620px] lg:min-w-0 w-full px-1 sm:px-2">
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
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <h3 className="text-[12px] font-bold tracking-tight text-[#1D1D1F] uppercase">
                GOOD
              </h3>
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
                  "relative flex w-[240px] min-h-[72px] flex-col justify-between rounded-[10px] border border-[rgba(0,113,227,0.16)] bg-[rgba(0,113,227,0.06)] p-3 text-left shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]",
                  goodSelected && "border-[#0071E3] ring-2 ring-[rgba(0,113,227,0.25)]",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#1D1D1F]">Good Products</span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-[11px] font-medium text-[#6E6E73]">Total Passed</span>
                  <span className="text-[20px] font-bold tabular leading-none text-[#1D1D1F]">
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
