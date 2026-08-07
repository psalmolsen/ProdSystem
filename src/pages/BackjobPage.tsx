import { useState, useEffect, useCallback } from "react";
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  Layers,
} from "lucide-react";
import { PageShell, Panel } from "@/components/app/page-shell";
import type { Backjob, BackjobStatus } from "@/types/backjob";
import {
  createBackjob,
  getAllBackjobs,
  updateBackjob,
  deleteBackjob,
} from "@/services/firestore/backjobService";
import { getAllJobOrders } from "@/services/firestore/jobOrderService";
import type { JobOrder } from "@/types/jobOrder";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  BackjobStatus,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  Pending: {
    label: "Pending",
    bg: "bg-[#FF9500]/10",
    text: "text-[#FF9500]",
    border: "border-[#FF9500]/30",
    icon: Clock,
  },
  "In Progress": {
    label: "In Progress",
    bg: "bg-[#0071E3]/10",
    text: "text-[#0071E3]",
    border: "border-[#0071E3]/30",
    icon: Wrench,
  },
  Resolved: {
    label: "Resolved",
    bg: "bg-[#34C759]/10",
    text: "text-[#34C759]",
    border: "border-[#34C759]/30",
    icon: CheckCircle2,
  },
  Completed: {
    label: "Completed",
    bg: "bg-[#5856D6]/10",
    text: "text-[#5856D6]",
    border: "border-[#5856D6]/30",
    icon: CheckCircle2,
  },
};

export function BackjobPage() {
  // Firestore State
  const [backjobs, setBackjobs] = useState<Backjob[]>([]);
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BackjobStatus | "All">("All");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBackjob, setSelectedBackjob] = useState<Backjob | null>(null);

  // Form Inputs
  const [selectedJoId, setSelectedJoId] = useState("");
  const [backjobNumberInput, setBackjobNumberInput] = useState("");
  const [joNumberInput, setJoNumberInput] = useState("");
  const [brandInput, setBrandInput] = useState("");
  const [reworksInput, setReworksInput] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [statusInput, setStatusInput] = useState<BackjobStatus>("Pending");

  // Feedback State
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Backjobs & Job Orders from Firestore
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bjResults, joResults] = await Promise.all([
        getAllBackjobs({ status: statusFilter, searchQuery }),
        getAllJobOrders(),
      ]);
      setBackjobs(bjResults);
      setJobOrders(joResults);
    } catch (err) {
      console.error("Failed to load Backjobs from Firestore:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-clear feedback banner
  useEffect(() => {
    if (!feedbackMessage) return;
    const t = window.setTimeout(() => setFeedbackMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMessage]);

  const resetForm = () => {
    setSelectedJoId("");
    setBackjobNumberInput("");
    setJoNumberInput("");
    setBrandInput("");
    setReworksInput("");
    setQtyInput("");
    setReasonInput("");
    setStatusInput("Pending");
    setFormError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (bj: Backjob) => {
    setSelectedBackjob(bj);
    setSelectedJoId(bj.joNumber);
    setBackjobNumberInput(bj.id.replace(/^BJ-/, ""));
    setJoNumberInput(bj.joNumber.replace(/^JO-/, ""));
    setBrandInput(bj.brand);
    setReworksInput(bj.reworksToPerform);
    setQtyInput(bj.qty ? String(bj.qty) : "");
    setReasonInput(bj.reason || "");
    setStatusInput(bj.status);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSelectJoFromDb = (joId: string) => {
    setSelectedJoId(joId);
    const matched = jobOrders.find((o) => o.id === joId);
    if (matched) {
      setJoNumberInput(matched.id.replace(/^JO-/, ""));
      setBrandInput(matched.brand);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joNumberInput.trim()) {
      setFormError("Please select a Job Order from the database.");
      return;
    }
    if (!reworksInput.trim()) {
      setFormError("Please specify the reworks to perform.");
      return;
    }
    if (!qtyInput.trim() || Number(qtyInput) <= 0) {
      setFormError("Please enter a valid quantity.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const created = await createBackjob({
        backjobNumber: backjobNumberInput,
        joNumber: joNumberInput,
        brand: brandInput,
        reworksToPerform: reworksInput,
        qty: qtyInput,
        reason: reasonInput,
        status: "Pending",
      });

      setIsCreateModalOpen(false);
      resetForm();
      setFeedbackMessage(`Backjob ${created.id} saved to Cloud Firestore successfully.`);
      await loadData();
    } catch (err) {
      console.error("Failed to create Backjob:", err);
      setFormError("Failed to save Backjob to Firestore. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBackjob) return;

    setSaving(true);
    setFormError(null);
    try {
      await updateBackjob(selectedBackjob.id, {
        joNumber: joNumberInput,
        brand: brandInput,
        reworksToPerform: reworksInput,
        qty: qtyInput,
        reason: reasonInput,
        status: statusInput,
      });

      setIsEditModalOpen(false);
      setSelectedBackjob(null);
      resetForm();
      setFeedbackMessage(`Backjob ${selectedBackjob.id} updated successfully.`);
      await loadData();
    } catch (err) {
      console.error("Failed to update Backjob:", err);
      setFormError("Failed to update Backjob in Firestore.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBackjob = async (backjobId: string) => {
    if (!window.confirm(`Are you sure you want to delete Backjob ${backjobId}?`)) return;

    setDeletingId(backjobId);
    try {
      await deleteBackjob(backjobId);
      setFeedbackMessage(`Backjob ${backjobId} deleted.`);
      await loadData();
    } catch (err) {
      console.error("Failed to delete Backjob:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell title="Backjob Management" breadcrumb={["CCB System", "Production", "Backjobs"]}>
      <div className="space-y-6">
        {/* ── Feedback Banner ───────────────────────────────────────── */}
        {feedbackMessage && (
          <div className="flex items-center gap-3 rounded-[12px] bg-[#DCFCE7] p-4 text-[14px] font-semibold text-[#16A34A] border border-[#BBF7D0]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* ── Main Backjob Table ───────────────────────────── */}
        <Panel
          title="Backjob Records"
          description="Manage and track returned or re-processed Job Orders in Cloud Firestore."
          actions={
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn-primary flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              <span>+ New Backjob</span>
            </button>
          }
        >
          {/* Toolbar: Search & Status Filters */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E6E73]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search BJ#, JO#, Brand, Reworks, or Reason..."
                className="h-[40px] w-full rounded-[10px] border border-[#D2D2D7] bg-[#F5F5F7] pl-10 pr-4 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-[10px] border border-[#D2D2D7] bg-[#F5F5F7] p-1">
              <Filter className="ml-2 h-3.5 w-3.5 text-[#6E6E73]" />
              {(["All", "Pending", "In Progress", "Resolved", "Completed"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "rounded-[7px] px-3 py-1 text-[12px] font-semibold transition-all cursor-pointer",
                    statusFilter === st
                      ? "bg-white text-[#0071E3] shadow-xs"
                      : "text-[#6E6E73] hover:text-[#1D1D1F]",
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-[12px] border border-[#D2D2D7]">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#D2D2D7] bg-[#F5F5F7] text-[11px] font-bold uppercase tracking-[0.05em] text-[#6E6E73]">
                  <th className="px-4 py-3 min-w-[110px]">Backjob ID</th>
                  <th className="px-4 py-3 min-w-[100px]">JO#</th>
                  <th className="px-4 py-3 min-w-[120px]">Brand Name</th>
                  <th className="px-4 py-3 min-w-[200px]">Reworks to Perform</th>
                  <th className="px-4 py-3 min-w-[80px]">QTY</th>
                  <th className="px-4 py-3 min-w-[160px]">Reason / Notes</th>
                  <th className="px-4 py-3 min-w-[120px]">Status</th>
                  <th className="px-4 py-3 min-w-[90px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7] bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#6E6E73]">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#0071E3]" />
                        <span>Loading Backjobs from Cloud Firestore...</span>
                      </div>
                    </td>
                  </tr>
                ) : backjobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#6E6E73]">
                      <RotateCcw className="mx-auto h-8 w-8 text-[#A1A1A6] mb-2" />
                      <p className="font-semibold text-[#1D1D1F]">No Backjobs found</p>
                      <p className="text-[12px] mt-1">Click "+ New Backjob" to create your first entry.</p>
                    </td>
                  </tr>
                ) : (
                  backjobs.map((bj) => {
                    const stConfig = STATUS_CONFIG[bj.status] || STATUS_CONFIG.Pending;
                    const StatusIcon = stConfig.icon;

                    return (
                      <tr key={bj.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-[#0071E3]">{bj.id}</td>
                        <td className="px-4 py-3 font-semibold text-[#1D1D1F]">{bj.joNumber}</td>
                        <td className="px-4 py-3 font-semibold text-[#1D1D1F]">{bj.brand}</td>
                        <td className="px-4 py-3 font-medium text-[#1D1D1F]">
                          {bj.reworksToPerform}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0071E3]">{bj.qty}</td>
                        <td className="px-4 py-3 text-[#6E6E73] max-w-[180px] truncate">
                          {bj.reason || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                              stConfig.bg,
                              stConfig.text,
                              stConfig.border,
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            <span>{stConfig.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(bj)}
                              className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#0071E3] transition-colors cursor-pointer"
                              title="Edit Backjob"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBackjob(bj.id)}
                              disabled={deletingId === bj.id}
                              className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#FFF2F2] hover:text-[#FF3B30] transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete Backjob"
                            >
                              {deletingId === bj.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin text-[#FF3B30]" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ── Modal: Create New Backjob ──────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl border border-[#D2D2D7] my-8">
            <div className="flex items-center justify-between border-b border-[#D2D2D7] pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0071E3]/10 text-[#0071E3]">
                  <Layers className="h-4 w-4" />
                </span>
                <h3 className="text-[17px] font-semibold text-[#1D1D1F]">
                  Create New Backjob
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full p-1 text-[#6E6E73] hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-[8px] bg-[#FFF2F2] p-3 text-[12px] font-medium text-[#DC2626]">
                  {formError}
                </div>
              )}

              {/* Select Job Order from Firestore DB */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  Select Job Order (JO# from Database) *
                </label>
                <select
                  value={selectedJoId}
                  onChange={(e) => handleSelectJoFromDb(e.target.value)}
                  className="mt-1.5 h-[40px] w-full rounded-[10px] border border-[#D2D2D7] bg-white px-3 text-[13px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select a Job Order saved in database --
                  </option>
                  {jobOrders.map((jo) => (
                    <option key={jo.id} value={jo.id}>
                      {jo.id} — {jo.brand || "Standard Brand"} ({jo.workOrder})
                    </option>
                  ))}
                </select>
              </div>

              {/* JO# & Brand Name (Auto-filled) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                    JO#
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={joNumberInput}
                    onChange={(e) => setJoNumberInput(e.target.value)}
                    required
                    className="mt-1.5 h-[38px] w-full rounded-[10px] border border-[#D2D2D7] bg-[#F5F5F7] px-3 text-[13px] font-bold text-[#1D1D1F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Akxel"
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    required
                    className="mt-1.5 h-[38px] w-full rounded-[10px] border border-[#D2D2D7] bg-[#F5F5F7] px-3 text-[13px] font-bold text-[#1D1D1F] outline-none"
                  />
                </div>
              </div>

              {/* Reworks to perform _____ & QTY ___ */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                    Reworks to Perform *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Valve Replacement & Pressure Re-test"
                    value={reworksInput}
                    onChange={(e) => setReworksInput(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                    QTY *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value.replace(/\D/g, ""))}
                    required
                    className="mt-1.5 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-bold tabular text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                  />
                </div>
              </div>

              {/* Reason / Defect Description */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  Reason / Defect Description
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="e.g. Leaking valve observed during pressure test..."
                  rows={2}
                  className="mt-1.5 w-full rounded-[10px] border border-[#D2D2D7] bg-white p-3 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D2D2D7]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-[10px] border border-[#D2D2D7] px-4 py-2 text-[13px] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary rounded-[10px] px-5 py-2 text-[13px] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving to Firestore..." : "Save Backjob"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Backjob ────────────────────────────────────────── */}
      {isEditModalOpen && selectedBackjob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl border border-[#D2D2D7] my-8">
            <div className="flex items-center justify-between border-b border-[#D2D2D7] pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0071E3]/10 text-[#0071E3]">
                  <Layers className="h-4 w-4" />
                </span>
                <h3 className="text-[17px] font-semibold text-[#1D1D1F]">
                  Edit Backjob — {selectedBackjob.id}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full p-1 text-[#6E6E73] hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-[8px] bg-[#FFF2F2] p-3 text-[12px] font-medium text-[#DC2626]">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Status Dropdown */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                    Status
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as BackjobStatus)}
                    className="mt-1.5 h-[38px] w-full rounded-[10px] border border-[#D2D2D7] bg-white px-3 text-[13px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3] cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* JO Number */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                    JO Number
                  </label>
                  <input
                    type="text"
                    value={joNumberInput}
                    onChange={(e) => setJoNumberInput(e.target.value)}
                    required
                    className="mt-1.5 h-[38px] w-full rounded-[10px] border border-[#D2D2D7] bg-white px-3 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                  />
                </div>
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  required
                  className="mt-1.5 h-[38px] w-full rounded-[10px] border border-[#D2D2D7] bg-white px-3 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                />
              </div>

              {/* Reworks to perform & QTY */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                    Reworks to Perform *
                  </label>
                  <input
                    type="text"
                    value={reworksInput}
                    onChange={(e) => setReworksInput(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                    QTY *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value.replace(/\D/g, ""))}
                    required
                    className="mt-1.5 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-bold tabular text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  Reason / Defect Description
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-[10px] border border-[#D2D2D7] bg-white p-3 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D2D2D7]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-[10px] border border-[#D2D2D7] px-4 py-2 text-[13px] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary rounded-[10px] px-5 py-2 text-[13px] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
