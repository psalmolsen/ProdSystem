import type { ReactNode } from "react";
import { AppHeader } from "./app-header";

export function PageShell({
  title,
  breadcrumb,
  action,
  children,
}: {
  title: string;
  breadcrumb: string[];
  action?: string;
  children: ReactNode;
}) {
  return (
    <>
      <AppHeader title={title} breadcrumb={breadcrumb} action={action} />
      <div className="mx-auto w-full max-w-[1440px] px-6 py-6">{children}</div>
    </>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  padded = true,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-panel">
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
