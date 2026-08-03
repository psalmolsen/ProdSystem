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
      {/* Max 1200px, generous gutters per design spec */}
      <div className="mx-auto w-full max-w-[1200px] px-6 py-8">{children}</div>
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
    /* Card: white fill, 16px radius, soft shadow — per spec */
    <section className="rounded-[16px] border border-[#D2D2D7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D2D2D7] px-6 py-5">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-[13px] text-[#6E6E73]">{description}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className={padded ? "p-6" : ""}>{children}</div>
    </section>
  );
}
