import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Download,
  Columns3,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  QrCode,
  MoreHorizontal,
} from "lucide-react";
import type { Cylinder } from "@/lib/ccb-data";
import { CYLINDERS } from "@/lib/ccb-data";
import { StatusBadge } from "./status-badge";
import { CylinderPanel } from "./cylinder-panel";
import { cn } from "@/lib/utils";

const filters = ["All stages", "All customers", "All statuses", "Last 7 days"];

export function CylinderTable({ stageFilter }: { stageFilter?: string }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<Cylinder | null>(null);
  const pageSize = 10;

  const rows = useMemo(() => {
    const base = stageFilter ? CYLINDERS.filter((c) => c.stage === stageFilter) : CYLINDERS;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) =>
      [c.serial, c.barcode, c.customer, c.brand, c.batch, c.operator].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [query, stageFilter]);

  const paged = rows.slice(page * pageSize, page * pageSize + pageSize);
  const allChecked = paged.length > 0 && paged.every((r) => selected.includes(r.id));

  return (
    <div className="rounded-lg border border-border bg-card shadow-panel">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search serial, barcode, batch, customer or operator"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/15"
          />
        </div>
        {filters.map((f) => (
          <button
            key={f}
            className="hidden h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground md:flex"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
            {f}
          </button>
        ))}
        <button className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <QrCode className="h-3.5 w-3.5" strokeWidth={1.75} />
          Scan
        </button>
        <button className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Columns3 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <button className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          Export
        </button>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 border-b border-border bg-accent px-4 py-2 text-[12px] text-accent-foreground">
          <span className="font-medium">{selected.length} selected</span>
          <button className="rounded px-2 py-1 font-medium hover:bg-primary/10">Advance stage</button>
          <button className="rounded px-2 py-1 font-medium hover:bg-primary/10">Assign operator</button>
          <button className="rounded px-2 py-1 font-medium text-destructive hover:bg-destructive/10">
            Flag for rework
          </button>
          <button onClick={() => setSelected([])} className="ml-auto text-muted-foreground hover:underline">
            Clear
          </button>
        </div>
      )}

      <div className="max-h-[620px] overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) =>
                    setSelected(e.target.checked ? paged.map((r) => r.id) : [])
                  }
                  className="h-3.5 w-3.5 accent-[oklch(0.462_0.185_267)]"
                />
              </th>
              {["Serial", "Customer", "Brand / Size", "Stage", "Location", "Operator", "Status", "Updated"].map(
                (h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-2.5 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      {h}
                      <ArrowUpDown className="h-3 w-3 opacity-40" strokeWidth={2} />
                    </span>
                  </th>
                ),
              )}
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {paged.map((c) => (
              <tr
                key={c.id}
                onClick={() => setActive(c)}
                className={cn(
                  "cursor-pointer border-t border-border transition-colors hover:bg-accent/60",
                  selected.includes(c.id) && "bg-accent/40",
                )}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={(e) =>
                      setSelected((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))
                    }
                    className="h-3.5 w-3.5 accent-[oklch(0.462_0.185_267)]"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="font-medium tabular">{c.serial}</div>
                  <div className="text-[11px] text-muted-foreground tabular">{c.barcode}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{c.customer}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {c.brand} \u00b7 {c.size}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{c.stage}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{c.location}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{c.operator}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground tabular">{c.updated}</td>
                <td className="px-4 py-3 text-right">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No cylinders match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
        <span className="tabular">
          {rows.length === 0 ? 0 : page * pageSize + 1}\u2013{Math.min(rows.length, (page + 1) * pageSize)} of{" "}
          {rows.length} cylinders
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card disabled:opacity-40 hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setPage((p) => ((p + 1) * pageSize < rows.length ? p + 1 : p))}
            disabled={(page + 1) * pageSize >= rows.length}
            className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card disabled:opacity-40 hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <CylinderPanel cylinder={active} onClose={() => setActive(null)} />
    </div>
  );
}
