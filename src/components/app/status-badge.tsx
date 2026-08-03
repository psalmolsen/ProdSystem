import { cn } from "@/lib/utils";
import type { StatusKey } from "@/lib/ccb-data";
import { STATUS_LABEL } from "@/lib/ccb-data";

const styles: Record<StatusKey, string> = {
  receiving: "bg-[#eef2ff] text-[#2563eb] ring-[#2563eb]/15",
  inspection: "bg-[#eef2ff] text-[#4f46e5] ring-[#4f46e5]/15",
  processing: "bg-[#eef2ff] text-[#2563eb] ring-[#2563eb]/15",
  completed: "bg-[#dcfce7] text-[#16a34a] ring-[#16a34a]/15",
  delivered: "bg-[#dcfce7] text-[#16a34a] ring-[#16a34a]/15",
  pending: "bg-[#fef3c7] text-[#b45309] ring-[#b45309]/15",
  rejected: "bg-[#fee2e2] text-[#dc2626] ring-[#dc2626]/15",
  rework: "bg-[#ffedd5] text-[#ea580c] ring-[#ea580c]/15",
  inactive: "bg-[#f1f5f9] text-[#64748b] ring-[#64748b]/15",
};

export function StatusBadge({ status, className }: { status: StatusKey; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}
