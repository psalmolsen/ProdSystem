import { useState } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Factory,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form states ready for tomorrow's Firebase Auth wiring
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"Operator" | "Supervisor" | "Manager">("Operator");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberShift, setRememberShift] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Quick fill helper for testing tomorrow
  const fillDemo = (demoEmail: string, demoRole: "Operator" | "Supervisor" | "Manager") => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setRole(demoRole);
    if (mode === "register") setFullName(`${demoRole} User`);
    setStatusMsg(`Filled demo credentials for ${demoRole}. Ready to wire up with Firebase Auth!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    // Placeholder simulated authentication response for UI preview
    setTimeout(() => {
      setLoading(false);
      setStatusMsg(
        mode === "login"
          ? `[UI Preview] Logging in as ${email || "Operator"}... Wire to Firebase Auth tomorrow!`
          : `[UI Preview] Creating account for ${fullName || "Operator"}... Wire to Firebase Auth tomorrow!`,
      );
    }, 800);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F5F5F7] lg:flex-row">
      {/* ── Left Hero / Branding Panel ────────────────────────────────────── */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[#1D1D1F] p-8 text-white lg:w-[48%] xl:w-[45%] xl:p-14">
        {/* Decorative background glow elements */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#0071E3]/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#34C759]/15 blur-[120px]" />

        {/* Top Header & Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#0071E3] shadow-[0_4px_20px_rgba(0,113,227,0.4)]">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight text-white">
                CCB Management System
              </h1>
              <p className="text-[12px] font-medium text-[#A1A1A6]">
                Centralized Cylinder Bottling
              </p>
            </div>
          </div>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-12 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0071E3]/40 bg-[#0071E3]/15 px-3.5 py-1.5 text-[12px] font-semibold text-[#64B5F6]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Plant Operations Portal</span>
            </div>
            <h2 className="mt-4 text-[32px] font-bold leading-tight tracking-tight text-white sm:text-[38px]">
              CCB Management System
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#A1A1A6]">
              Real-time LPG cylinder requalification and production tracking.
            </p>
          </div>

          <div className="space-y-3.5 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3 text-[14px] text-[#E5E5EA]">
              <CheckCircle2 className="h-5 w-5 text-[#34C759] shrink-0" />
              <span>Multi-variant capacity tracking (11kg, 22kg, 50kg)</span>
            </div>
            <div className="flex items-center gap-3 text-[14px] text-[#E5E5EA]">
              <CheckCircle2 className="h-5 w-5 text-[#34C759] shrink-0" />
              <span>Real-time station workflow & bottleneck monitoring</span>
            </div>
            <div className="flex items-center gap-3 text-[14px] text-[#E5E5EA]">
              <CheckCircle2 className="h-5 w-5 text-[#34C759] shrink-0" />
              <span>Authorized Google single sign-on</span>
            </div>
          </div>
        </div>

        {/* Footer Status Badge */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[12px] text-[#86868B]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#34C759] animate-pulse" />
            Firestore Cloud Connected
          </span>
          <span>v1.0.0 MES Production</span>
        </div>
      </div>

      {/* ── Right Auth Form Panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[440px]">
          {/* Card Wrapper */}
          <div className="rounded-[24px] border border-[#D2D2D7] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] sm:p-10">
            {/* Mode Switcher Tabs (Sign In / Register) */}
            <div className="mb-8 flex rounded-[14px] bg-[#F5F5F7] p-1 border border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStatusMsg(null);
                }}
                className={cn(
                  "flex-1 rounded-[10px] py-2.5 text-[14px] font-semibold transition-all duration-200",
                  mode === "login"
                    ? "bg-white text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]",
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setStatusMsg(null);
                }}
                className={cn(
                  "flex-1 rounded-[10px] py-2.5 text-[14px] font-semibold transition-all duration-200",
                  mode === "register"
                    ? "bg-white text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]",
                )}
              >
                Register
              </button>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h3 className="text-[24px] font-bold text-[#1D1D1F]">
                {mode === "login" ? "Welcome back" : "Register Operator Account"}
              </h3>
              <p className="mt-1 text-[13px] text-[#6E6E73]">
                {mode === "login"
                  ? "Sign in with your plant credentials to log production."
                  : "Create a new operator account for station access."}
              </p>
            </div>

            {/* Status / Preview Banner */}
            {statusMsg && (
              <div className="mb-6 rounded-[12px] bg-[#F5F5F7] p-3.5 text-[13px] font-medium text-[#0071E3] border border-[#0071E3]/20 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#0071E3]" />
                <span>{statusMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#1D1D1F]">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      className="h-[46px] w-full rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] px-4 text-[14px] text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#1D1D1F]">
                  Email Address / Operator ID
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-[#86868B]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@ccb.com"
                    className="h-[46px] w-full rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] pl-10 pr-4 text-[14px] text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#1D1D1F]">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-[#86868B]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-[46px] w-full rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] pl-10 pr-10 text-[14px] text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[#86868B] hover:text-[#1D1D1F]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Station Role Selection */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#1D1D1F]">
                  Plant Station Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "Operator" | "Supervisor" | "Manager")}
                  className="h-[46px] w-full rounded-[12px] border border-[#D2D2D7] bg-[#F5F5F7] px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
                >
                  <option value="Operator">Plant Operator (2-Hour Encoding)</option>
                  <option value="Supervisor">Shift Supervisor (Review & Locking)</option>
                  <option value="Manager">Plant Manager (Full Admin Analytics)</option>
                </select>
              </div>

              {mode === "login" && (
                <div className="flex items-center justify-between text-[13px]">
                  <label className="flex items-center gap-2 cursor-pointer text-[#6E6E73] hover:text-[#1D1D1F]">
                    <input
                      type="checkbox"
                      checked={rememberShift}
                      onChange={(e) => setRememberShift(e.target.checked)}
                      className="h-4 w-4 rounded border-[#D2D2D7] text-[#0071E3] focus:ring-[#0071E3]"
                    />
                    <span>Remember shift login</span>
                  </label>
                  <a href="#/auth" className="font-semibold text-[#0071E3] hover:underline">
                    Forgot ID?
                  </a>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#0071E3] text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(0,113,227,0.25)] transition-all hover:bg-[#005bb5] active:scale-[0.99] disabled:opacity-50"
              >
                <span>{mode === "login" ? "Sign In to Station" : "Create Operator Account"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Fill Demo Badges for Testing Tomorrow */}
            <div className="mt-8 border-t border-[#E5E5EA] pt-6">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[#86868B]">
                Tomorrow Setup — Demo Fill Shortcuts
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("operator@ccb.com", "Operator")}
                  className="rounded-[8px] border border-[#D2D2D7] bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] transition hover:bg-[#0071E3] hover:text-white"
                >
                  Fill Operator
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("supervisor@ccb.com", "Supervisor")}
                  className="rounded-[8px] border border-[#D2D2D7] bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] transition hover:bg-[#5856D6] hover:text-white"
                >
                  Fill Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("manager@ccb.com", "Manager")}
                  className="rounded-[8px] border border-[#D2D2D7] bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] transition hover:bg-[#34C759] hover:text-white"
                >
                  Fill Manager
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[12px] text-[#86868B]">
            Protected by Firebase Security Rules · CCB Production Tracking Engine
          </p>
        </div>
      </div>
    </div>
  );
}
