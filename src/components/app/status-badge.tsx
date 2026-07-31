import { cn } from "@/lib/utils";
import type { StatusKey } from "@/lib/ccb-data";
import { STATUS_LABEL } from "@/lib/ccb-data";

const styles: Record<StatusKey, string> = {
  receiving: "bg-accent text-accent-foreground ring-primary/15",
  inspection: "bg-[oklch(0.96_0.03_300)] text-[oklch(0.45_0.19_300)] ring-[oklch(0.45_0.19_300)]/15",
  processing: "bg-accent text-accent-foreground ring-primary/15",
  completed: "bg-[oklch(0.96_0.03_152)] text-success ring-success/20",
  delivered: "bg-[oklch(0.96_0.03_152)] text-success ring-success/20",
  pending: "bg-[oklch(0.97_0.04_89)] text-[oklch(0.52_0.12_70)] ring-warning/25",
  rejected: "bg-[oklch(0.96_0.03_27)] text-destructive ring-destructive/20",
  rework: "bg-[oklch(0.96_0.04_55)] text-[oklch(0.56_0.17_45)] ring-[oklch(0.56_0.17_45)]/20",
  inactive: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ status, className }: { status: StatusKey; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}
