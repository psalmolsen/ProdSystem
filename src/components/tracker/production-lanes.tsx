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
      title={`${label} \u00b7 ${total} units`}
      className={cn(
        "relative flex min-h-[76px] min-w-0 flex-1 flex-col justify-between gap-2 overflow-hidden rounded-[12px] border px-3 py-3 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1",
        "bg-[rgba(0,113,227,0.06)]",
        "border-[rgba(0,113,227,0.16)]",
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
      </span>
      <span className="text-[22px] font-semibold tabular leading-none tracking-[-0.02em] text-[#1D1D1F] xl:text-[24px]">
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
  const display =
    station.direction === "rtl" ? [...station.subProcesses].reverse() : station.subProcesses;
  const nodeTotals = display.map((sp) => totals[stepKey(station.id, sp)] ?? 0);

  const exitIndex = station.direction === "ltr" ? display.length - 1 : 0;
  const exitTotal = nodeTotals[exitIndex];
  const exitIntensity = maxTotal > 0 ? exitTotal / maxTotal : 0;
  const exitSide = station.direction === "ltr" ? "right" : "left";

  const DirectionIcon = station.direction === "ltr" ? ArrowRight : ArrowLeft;

  return (
    <div>
      <div className="mb-2 flex items-center justify-center gap-2">
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[rgba(0,113,227,0.10)] px-1 text-[10px] font-semibold tabular text-[#0071E3]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="eyebrow">{station.id}</h3>
        <DirectionIcon
          className="h-4 w-4 text-[#6E6E73]/50"
          strokeWidth={1.5}
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
  overload: Bottleneck | null;
  selected: StepSelection | null;
  onSelectStep: (selection: StepSelection) => void;
}) {
  const maxTotal = Math.max(0, ...Object.values(totals));

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
        </div>
      </div>
    </div>
  );
}
