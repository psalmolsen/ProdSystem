import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ccbLogo from "@/assets/ccb-logo.png";
import { AlertCircle, Factory, Loader2, ShieldCheck, Sparkles } from "lucide-react";

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginPage() {
  const { signIn, error: authError, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    try {
      await signIn();
      // Redirect to Dashboard
      window.location.hash = "#/";
    } catch (err: any) {
      if (!err?.message) {
        setLocalError("An unexpected error occurred during Google sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = authError || localError;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F5F5F7] lg:flex-row">
      {/* ── Left Branding Panel ────────────────────────────────────── */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[#1D1D1F] p-8 text-white lg:w-[48%] xl:w-[45%] xl:p-14">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#0071E3]/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#34C759]/15 blur-[120px]" />

        {/* Header & Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-md">
              <img src={ccbLogo} alt="CCB Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold tracking-tight text-white">
                CCB Management System
              </h1>
              <p className="text-[12px] font-medium text-[#A1A1A6]">
                Centralized Cylinder Bottling
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 my-12 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0071E3]/40 bg-[#0071E3]/15 px-3.5 py-1.5 text-[12px] font-semibold text-[#64B5F6]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Plant Operations Portal</span>
            </div>
            <h2 className="mt-4 text-[32px] font-bold leading-tight tracking-tight text-white sm:text-[38px]">
              CCB Management System
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[#A1A1A6]">
              Real-time LPG cylinder requalification and production tracking.
            </p>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3 text-[13px] text-[#E5E5EA]">
              <ShieldCheck className="h-4 w-4 text-[#34C759] shrink-0" />
              <span>Multi-variant capacity tracking (11kg, 22kg, 50kg)</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#E5E5EA]">
              <Factory className="h-4 w-4 text-[#0071E3] shrink-0" />
              <span>Real-time station workflow & bottleneck monitoring</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#E5E5EA]">
              <ShieldCheck className="h-4 w-4 text-[#34C759] shrink-0" />
              <span>Authorized Google single sign-on</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-[#A1A1A6]">
          © {new Date().getFullYear()} Centralized Cylinder Bottling. All rights reserved.
        </div>
      </div>

      {/* ── Right Login Form Area ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Main Card */}
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="text-center">
              {/* Company Logo Placeholder */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F5F7] p-3 shadow-inner border border-[#E5E5EA]">
                <img src={ccbLogo} alt="CCB Logo" className="h-full w-full object-contain" />
              </div>

              {/* System Title */}
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Sign In to System
              </h2>
              <p className="mt-1.5 text-sm text-[#6E6E73]">
                Use your authorized Google account to continue to the Dashboard.
              </p>
            </div>

            {/* Error Message Display */}
            {activeError && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Authentication Failed</p>
                  <p className="mt-0.5 text-xs text-red-700">{activeError}</p>
                </div>
              </div>
            )}

            {/* "Continue with Google" Button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D2D2D7] bg-white px-5 py-3.5 text-sm font-semibold text-[#1D1D1F] shadow-sm hover:bg-[#F5F5F7] hover:border-[#86868B] active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-[#0071E3]" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="h-5 w-5 shrink-0" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-[#86868B]">
              Protected by Firebase Authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
