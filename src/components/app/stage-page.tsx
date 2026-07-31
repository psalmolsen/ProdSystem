import { PageShell, Panel } from "@/components/app/page-shell";
import { CylinderTable } from "@/components/app/cylinder-table";

export function StagePage({
  title,
  group,
  stage,
  metrics,
  action,
}: {
  title: string;
  group: string;
  stage?: string;
  metrics: { label: string; value: string }[];
  action?: string;
}) {
  return (
    <PageShell title={title} breadcrumb={["CCB", group, title]} action={action}>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-card px-4 py-3.5 shadow-panel">
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1.5 text-[22px] font-semibold tabular tracking-[-0.02em]">{m.value}</p>
          </div>
        ))}
      </div>
      <CylinderTable stageFilter={stage} />
      <div className="mt-6">
        <Panel title="Station notes" description="Operator handover log for the current shift">
          <ul className="space-y-3 text-[13px]">
            {[
              ["06:00", "Shift A started. Two stations offline for calibration."],
              ["09:20", "Batch BATCH-2402 released to next stage after supervisor sign-off."],
              ["12:45", "Pressure gauge #4 recalibrated, tolerance verified."],
            ].map(([time, note]) => (
              <li key={time} className="flex gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <span className="w-12 shrink-0 text-muted-foreground tabular">{time}</span>
                <span className="text-foreground/90">{note}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
