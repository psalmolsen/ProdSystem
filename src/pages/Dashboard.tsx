import {
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CircleCheck,
  Clock3,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageShell, Panel } from "@/components/app/page-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { STAGES, THROUGHPUT, CYLINDERS } from "@/lib/ccb-data";

const kpis: { label: string; value: string; delta?: string; up?: boolean; tone?: "danger" | "warning" }[] = [
  { label: "Total Cylinders", value: "1,574", delta: "+4.2%", up: true },
  { label: "Receiving", value: "184", delta: "+12", up: true },
  { label: "Inspection", value: "156", delta: "-8", up: false },
  { label: "Requalification", value: "132", delta: "+6", up: true },
  { label: "Leak Testing", value: "98" },
  { label: "Painting", value: "121" },
  { label: "Valve Installation", value: "87" },
  { label: "Ready for Dispatch", value: "210", delta: "+31", up: true },
  { label: "Delivered Today", value: "342", delta: "+9.1%", up: true },
  { label: "Buffer Tanks", value: "64" },
  { label: "Rejected", value: "23", tone: "danger" },
  { label: "Customer Return", value: "11", tone: "warning" },
  { label: "Rework", value: "17", tone: "warning" },
  { label: "Pending Inspection", value: "61" },
  { label: "Completed Today", value: "398" },
];

export function Dashboard() {
  const maxStage = Math.max(...STAGES.map((s) => s.count));

  return (
    <PageShell title="Operations Dashboard" breadcrumb={["CCB", "Overview", "Dashboard"]}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-border bg-card px-4 py-3.5 shadow-panel transition-shadow hover:shadow-raised"
          >
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {k.label}
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className={
                  "text-[22px] font-semibold tabular tracking-[-0.02em]" +
                  (k.tone === "danger"
                    ? " text-destructive"
                    : k.tone === "warning"
                      ? " text-[oklch(0.56_0.15_70)]"
                      : "")
                }
              >
                {k.value}
              </span>
              {k.delta && (
                <span
                  className={
                    "inline-flex items-center gap-0.5 text-[11px] font-medium " +
                    (k.up ? "text-success" : "text-destructive")
                  }
                >
                  {k.up ? (
                    <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
                  )}
                  {k.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Live operation status"
          description="Cylinder movement through production stages \u00b7 updated 40 seconds ago"
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[oklch(0.96_0.03_152)] px-2 py-1 text-[11px] font-medium text-success ring-1 ring-inset ring-success/20">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Live
            </span>
          }
          padded={false}
        >
          <ul className="divide-y divide-border">
            {STAGES.map((s) => {
              const pct = Math.round((s.completed / s.count) * 100) || 0;
              return (
                <li
                  key={s.key}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 transition-colors hover:bg-accent/50 sm:grid-cols-[180px_minmax(0,1fr)_auto]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="truncate text-[13px] font-medium">{s.label}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-200"
                        style={{ width: `${(s.count / maxStage) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground tabular">
                      {s.completed} completed \u00b7 {s.pending} pending \u00b7 {pct}% cleared
                    </p>
                  </div>
                  <span className="text-[15px] font-semibold tabular">{s.count}</span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Needs attention" description="Items blocking throughput right now">
            <ul className="space-y-3">
              {[
                {
                  icon: AlertTriangle,
                  tone: "text-destructive",
                  title: "23 cylinders rejected today",
                  meta: "Underweight and pinhole leaks \u00b7 Quarantine bay",
                },
                {
                  icon: Clock3,
                  tone: "text-[oklch(0.56_0.15_70)]",
                  title: "61 units pending inspection over 4h",
                  meta: "Line 2 \u00b7 Station 3 backlog",
                },
                {
                  icon: CircleCheck,
                  tone: "text-success",
                  title: "210 units ready for dispatch",
                  meta: "Awaiting Solane Energy pickup at 16:00",
                },
              ].map((a) => (
                <li key={a.title} className="flex gap-3 rounded-md border border-border p-3">
                  <a.icon className={`h-4 w-4 shrink-0 ${a.tone}`} strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{a.title}</p>
                    <p className="text-[11.5px] text-muted-foreground">{a.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Weekly throughput" description="Processed vs delivered cylinders">
            <div className="h-[196px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={THROUGHPUT} barGap={4}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="processed" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="delivered" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <Panel
          title="Recent cylinder activity"
          description="Latest scans logged across all stations"
          padded={false}
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                <th className="px-5 py-2.5 font-semibold">Serial</th>
                <th className="px-5 py-2.5 font-semibold">Customer</th>
                <th className="hidden px-5 py-2.5 font-semibold md:table-cell">Stage</th>
                <th className="hidden px-5 py-2.5 font-semibold lg:table-cell">Operator</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 text-right font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {CYLINDERS.slice(0, 6).map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-5 py-3 font-medium tabular">{c.serial}</td>
                  <td className="px-5 py-3">{c.customer}</td>
                  <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">{c.stage}</td>
                  <td className="hidden px-5 py-3 text-muted-foreground lg:table-cell">{c.operator}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground tabular">{c.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </PageShell>
  );
}
