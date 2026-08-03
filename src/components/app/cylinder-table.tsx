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
    <div className="rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-card shadow-panel">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-[rgba(15,23,42,0.06)] px-5 py-4">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search serial, barcode, batch, customer or operator"
            className="input-field pl-10"
          />
        </div>
        {filters.map((f) => (
          <button
            key={f}
            className="hidden h-11 items-center gap-1.5 rounded-[14px] border border-[rgba(15,23,42,0.08)] bg-[#f8fafc] px-3 text-[12px] font-medium text-[#1e293b] transition-colors duration-150 hover:bg-[#eef2ff] md:flex"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
            {f}
          </button>
        ))}
        <button className="flex h-11 items-center gap-1.5 rounded-[14px] border border-[rgba(15,23,42,0.08)] bg-[#f8fafc] px-3 text-[12px] font-medium text-[#1e293b] transition-colors duration-150 hover:bg-[#eef2ff]">
          <QrCode className="h-4 w-4" strokeWidth={1.75} />
          Scan
        </button>
        <button className="flex h-11 items-center gap-1.5 rounded-[14px] border border-[rgba(15,23,42,0.08)] bg-[#f8fafc] px-3 text-[12px] font-medium text-[#1e293b] transition-colors duration-150 hover:bg-[#eef2ff]">
          <Columns3 className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button className="flex h-11 items-center gap-1.5 rounded-[14px] border border-[rgba(15,23,42,0.08)] bg-[#f8fafc] px-3 text-[12px] font-medium text-[#1e293b] transition-colors duration-150 hover:bg-[#eef2ff]">
          <Download className="h-4 w-4" strokeWidth={1.75} />
          Export
        </button>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 border-b border-[rgba(15,23,42,0.06)] bg-[#eef2ff] px-5 py-2.5 text-[12px] text-[#2563eb]">
          <span className="font-medium">{selected.length} selected</span>
          <button className="rounded-lg px-2 py-1 font-medium hover:bg-white">Advance stage</button>
          <button className="rounded-lg px-2 py-1 font-medium hover:bg-white">Assign operator</button>
          <button className="rounded-lg px-2 py-1 font-medium text-[#dc2626] hover:bg-white">
            Flag for rework
          </button>
          <button onClick={() => setSelected([])} className="ml-auto text-muted-foreground hover:underline">
            Clear
          </button>
        </div>
      )}

      <div className="max-h-[620px] overflow-auto px-3 py-2">
        <table className="w-full border-separate text-[13px]" style={{ borderSpacing: "0 6px" }}>
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
              <th className="w-10 rounded-l-[10px] bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) =>
                    setSelected(e.target.checked ? paged.map((r) => r.id) : [])
                  }
                  className="h-4 w-4 rounded accent-[#2563eb]"
                />
              </th>
              {["Serial", "Customer", "Brand / Size", "Stage", "Location", "Operator", "Status", "Updated"].map(
                (h) => (
                  <th key={h} className="whitespace-nowrap bg-white px-4 py-3 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      {h}
                      <ArrowUpDown className="h-3 w-3 opacity-40" strokeWidth={1.75} />
                    </span>
                  </th>
                ),
              )}
              <th className="w-10 rounded-r-[10px] bg-white px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paged.map((c) => (
              <tr
                key={c.id}
                onClick={() => setActive(c)}
                className={cn(
                  "cursor-pointer bg-white shadow-small transition-all duration-150",
                  selected.includes(c.id)
                    ? "bg-[#eef2ff]"
                    : "hover:bg-[#eef2ff] hover:shadow-medium",
                )}
              >
                <td className="rounded-l-[10px] px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={(e) =>
                      setSelected((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))
                    }
                    className="h-4 w-4 rounded accent-[#2563eb]"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="font-medium tabular">{c.serial}</div>
                  <div className="text-[11px] text-muted-foreground tabular">{c.barcode}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">{c.customer}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                  {c.brand} · {c.size}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">{c.stage}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{c.location}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{c.operator}</td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <StatusBadge status={c.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground tabular">{c.updated}</td>
                <td className="rounded-r-[10px] px-4 py-3.5 text-right">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={10} className="rounded-[10px] bg-white px-4 py-16 text-center">
                  <div className="mx-auto max-w-xs">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-[14px] bg-[#eef2ff]">
                      <Search className="h-5 w-5 text-[#2563eb]" strokeWidth={1.75} />
                    </span>
                    <p className="mt-4 text-[13px] font-medium text-foreground/80">
                      No cylinders match this search
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Try adjusting or clearing your filters to see more results.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setPage(0);
                      }}
                      className="btn-secondary mt-5"
                    >
                      Clear search
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(15,23,42,0.06)] px-5 py-4 text-[12px] text-muted-foreground">
        <span className="tabular">
          {rows.length === 0 ? 0 : page * pageSize + 1}\u2013{Math.min(rows.length, (page + 1) * pageSize)} of{" "}
          {rows.length} cylinders
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="grid h-10 w-10 place-items-center rounded-[12px] border border-[rgba(15,23,42,0.08)] bg-white text-[#64748b] transition-colors duration-150 hover:bg-[#eef2ff] hover:text-[#2563eb] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setPage((p) => ((p + 1) * pageSize < rows.length ? p + 1 : p))}
            disabled={(page + 1) * pageSize >= rows.length}
            className="grid h-10 w-10 place-items-center rounded-[12px] border border-[rgba(15,23,42,0.08)] bg-white text-[#64748b] transition-colors duration-150 hover:bg-[#eef2ff] hover:text-[#2563eb] disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <CylinderPanel cylinder={active} onClose={() => setActive(null)} />
    </div>
  );
}
