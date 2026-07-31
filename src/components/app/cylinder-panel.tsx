import { X, FileText, Camera, Wrench, ClipboardCheck, Printer } from "lucide-react";
import type { Cylinder } from "@/lib/ccb-data";
import { TIMELINE } from "@/lib/ccb-data";
import { StatusBadge } from "./status-badge";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-medium">{value}</dd>
    </div>
  );
}

export function CylinderPanel({
  cylinder,
  onClose,
}: {
  cylinder: Cylinder | null;
  onClose: () => void;
}) {
  if (!cylinder) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-foreground/25 animate-in fade-in duration-150"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col border-l border-border bg-card shadow-raised animate-in slide-in-from-right duration-200">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="eyebrow">Cylinder</p>
            <h2 className="truncate text-lg font-semibold tabular">{cylinder.serial}</h2>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={cylinder.status} />
              <span className="text-xs text-muted-foreground">Updated {cylinder.updated}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-border px-6 py-5">
            <p className="eyebrow mb-3">Cylinder information</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Barcode" value={cylinder.barcode} />
              <Field label="Batch" value={cylinder.batch} />
              <Field label="Customer" value={cylinder.customer} />
              <Field label="Brand" value={cylinder.brand} />
              <Field label="Size" value={cylinder.size} />
              <Field label="Current stage" value={cylinder.stage} />
              <Field label="Location" value={cylinder.location} />
              <Field label="Assigned operator" value={cylinder.operator} />
              <Field label="Inspection result" value={cylinder.inspection} />
              <Field label="Previous status" value="Processing" />
            </dl>
          </div>

          <div className="border-b border-border px-6 py-5">
            <p className="eyebrow mb-4">Movement timeline</p>
            <ol className="relative space-y-5 border-l border-border pl-5">
              {TIMELINE.map((t) => (
                <li key={t.stage} className="relative">
                  <span className="absolute -left-[25px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-accent" />
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-medium">{t.stage}</p>
                    <span className="text-[11px] text-muted-foreground tabular">{t.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/80">Logged by {t.operator}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-border px-6 py-5">
            {[
              { icon: ClipboardCheck, label: "Inspection history", value: "4 records" },
              { icon: Wrench, label: "Repair & valve history", value: "2 records" },
              { icon: Camera, label: "Photos", value: "6 files" },
              { icon: FileText, label: "Documents", value: "3 files" },
            ].map((c) => (
              <button
                key={c.label}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-3 text-left hover:bg-accent"
              >
                <c.icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{c.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{c.value}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <footer className="flex items-center gap-2 border-t border-border px-6 py-4">
          <button className="h-9 flex-1 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary-dark">
            Advance to next stage
          </button>
          <button className="h-9 rounded-md border border-border px-3 text-[13px] font-medium hover:bg-accent">
            Flag rework
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent">
            <Printer className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </footer>
      </aside>
    </div>
  );
}
