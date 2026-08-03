import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricTone = "primary" | "success" | "warning" | "danger";

const toneChip: Record<MetricTone, string> = {
  primary: "bg-[#eef2ff] text-[#2563eb]",
  success: "bg-[#dcfce7] text-[#16a34a]",
  warning: "bg-[#fef3c7] text-[#b45309]",
  danger: "bg-[#fee2e2] text-[#dc2626]",
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: MetricTone;
}) {
  return (
    <section className="card-lift rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-card p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>
          <p className="mt-2 text-[28px] font-semibold tabular tracking-[-0.02em]">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[14px]", toneChip[tone])}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
      </div>
    </section>
  );
}
