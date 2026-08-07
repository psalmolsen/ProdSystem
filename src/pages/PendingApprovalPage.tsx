import React from "react";
import { useAuth } from "@/hooks/useAuth";
import ccbLogo from "@/assets/ccb-logo.png";
import { Clock, LogOut } from "lucide-react";

export function PendingApprovalPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F5F5F7] lg:flex-row">
      {/* ── Left Hero / Branding Panel ────────────────────────────────────── */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[#1D1D1F] p-8 text-white lg:w-[48%] xl:w-[45%] xl:p-14">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#0071E3]/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#FF9500]/15 blur-[120px]" />

        {/* Header & Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-md">
              <img src={ccbLogo} alt="Company Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold tracking-tight text-white">
                CCB Production Execution System
              </h1>
              <p className="text-[12px] font-medium text-[#A1A1A6]">
                LPG Cylinder Requalification MES
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 my-12 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF9500]/40 bg-[#FF9500]/15 px-3.5 py-1.5 text-[12px] font-semibold text-[#FFB340]">
              <Clock className="h-3.5 w-3.5" />
              <span>Access Pending</span>
            </div>
            <h2 className="mt-4 text-[30px] font-bold leading-tight tracking-tight text-white sm:text-[36px]">
              Your account request is under review.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[#A1A1A6]">
              An administrator will review and assign your system permissions before full access is granted.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-[#A1A1A6]">
          © {new Date().getFullYear()} Centralized Cylinder Bottling. All rights reserved.
        </div>
      </div>

      {/* ── Right Content Area ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF9500]/10 p-3 border border-[#FF9500]/30 text-[#FF9500]">
                <Clock className="h-8 w-8" />
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Account Pending Approval
              </h2>

              {/* Exact required notification lines */}
              <div className="mt-6 rounded-xl bg-[#F5F5F7] p-5 text-left space-y-3.5 border border-[#E5E5EA]">
                <p className="text-sm font-medium text-[#1D1D1F] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#34C759]"></span>
                  Your account has been created.
                </p>
                <p className="text-sm font-medium text-[#1D1D1F] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0071E3]"></span>
                  Your access request has been submitted.
                </p>
                <p className="text-sm text-[#6E6E73]">
                  Please wait for an administrator to approve your account.
                </p>
                <p className="text-xs text-[#86868B] italic pt-1 border-t border-[#D2D2D7]/50">
                  You may close this window and try again later.
                </p>
              </div>
            </div>

            {/* Authenticated User Info */}
            {user && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#E5E5EA] p-3.5 bg-white">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="h-10 w-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0071E3] text-sm font-semibold text-white">
                    {(user.displayName || user.email || "U").substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1D1D1F]">
                    {user.displayName || "Google Account User"}
                  </p>
                  <p className="truncate text-xs text-[#6E6E73]">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Sign Out Button (Only allowed action on this page) */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => signOut()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D2D2D7] bg-white px-5 py-3 text-sm font-semibold text-[#FF3B30] shadow-sm hover:bg-[#FFF5F5] hover:border-[#FF3B30]/40 active:scale-[0.99] transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
