import { useState, useEffect, useMemo, useCallback } from "react";
import type { FormEvent } from "react";
import {
  Plus,
  Search,
  Edit2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  X,
  Layers,
  Trash2,
} from "lucide-react";
import { PageShell, Panel } from "@/components/app/page-shell";
import { StatusBadge } from "@/components/app/status-badge";
import type { JobOrder, JobOrderStatus, OtherWorkOrderItem } from "@/types/jobOrder";
import {
  createJobOrder,
  getAllJobOrders,
  updateJobOrder,
} from "@/services/firestore/jobOrderService";
import type { StatusKey } from "@/lib/ccb-data";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: JobOrderStatus[] = ["Active", "Pending", "Completed", "Cancelled"];

function mapJobStatusToBadgeKey(status: JobOrderStatus): StatusKey {
  switch (status) {
    case "Pending":
      return "pending";
    case "Active":
      return "processing";
    case "Completed":
      return "completed";
    case "Cancelled":
      return "rejected";
    default:
      return "inactive";
  }
}

export function JobOrdersPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobOrderStatus | "All">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJobOrder, setEditingJobOrder] = useState<JobOrder | null>(null);

  // Form input state
  const [joNumberInput, setJoNumberInput] = useState("");
  const [brandInput, setBrandInput] = useState("");
  const [cnfInput, setCnfInput] = useState("");
  const [cfInput, setCfInput] = useState("");
  const [cnInput, setCnInput] = useState("");
  const [otherItemsInput, setOtherItemsInput] = useState<OtherWorkOrderItem[]>([]);
  const [statusInput, setStatusInput] = useState<JobOrderStatus>("Active");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orders = await getAllJobOrders();
      setJobOrders(orders);
    } catch (err) {
      console.error("Failed to load job orders from Firestore:", err);
      setError("Failed to connect to Firestore.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return jobOrders.filter((order) => {
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        order.workOrder.toLowerCase().includes(q) ||
        order.brand.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        (order.otherItems && order.otherItems.some((i) => i.label.toLowerCase().includes(q)));
      return matchesStatus && matchesSearch;
    });
  }, [jobOrders, statusFilter, searchQuery]);

  // Paginated slices
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // ── Other Items Form Helpers ────────────────────────────────────────────────
  const addOtherItemRow = () => {
    setOtherItemsInput((prev) => [...prev, { label: "", qty: "" }]);
  };

  const updateOtherItemRow = (index: number, field: keyof OtherWorkOrderItem, val: string) => {
    setOtherItemsInput((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  const removeOtherItemRow = (index: number) => {
    setOtherItemsInput((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Open Modals ─────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setJoNumberInput("");
    setBrandInput("");
    setCnfInput("");
    setCfInput("");
    setCnInput("");
    setOtherItemsInput([{ label: "", qty: "" }]);
    setStatusInput("Active");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const openEditModal = (order: JobOrder) => {
    setEditingJobOrder(order);
    const matchDigits = order.id.replace(/\D/g, "");
    setJoNumberInput(matchDigits || order.id);
    setBrandInput(order.brand);
    setCnfInput(order.cnf ? String(order.cnf) : "");
    setCfInput(order.cf ? String(order.cf) : "");
    setCnInput(order.cn ? String(order.cn) : (order.c ? String(order.c) : ""));
    setOtherItemsInput(
      order.otherItems && order.otherItems.length > 0
        ? order.otherItems.map((i) => ({ label: i.label, qty: String(i.qty) }))
        : [{ label: "", qty: "" }],
    );
    setStatusInput(order.status);
    setFormError("");
    setIsEditModalOpen(true);
  };

  // ── Create Submission ───────────────────────────────────────────────────────
  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!brandInput.trim()) {
      setFormError("Brand name is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await createJobOrder({
        joNumber: joNumberInput,
        brand: brandInput,
        cnf: cnfInput,
        cf: cfInput,
        cn: cnInput,
        otherItems: otherItemsInput,
        status: "Active",
      });
      setIsCreateModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Failed to create Job Order:", err);
      setFormError("Failed to save Job Order to Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit Submission ─────────────────────────────────────────────────────────
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingJobOrder) return;
    if (!brandInput.trim()) {
      setFormError("Brand name is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await updateJobOrder(editingJobOrder.id, {
        brand: brandInput,
        cnf: cnfInput,
        cf: cfInput,
        cn: cnInput,
        otherItems: otherItemsInput,
        status: statusInput,
      });
      setIsEditModalOpen(false);
      setEditingJobOrder(null);
      await loadData();
    } catch (err) {
      console.error("Failed to update Job Order:", err);
      setFormError("Failed to update Job Order in Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Job Orders Section"
      breadcrumb={["Overview", "Job Orders"]}
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col gap-4 rounded-[16px] border border-[#D2D2D7] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold text-[#1D1D1F]">
              Job Orders Master List
            </h1>
            <p className="mt-1 text-[13px] text-[#6E6E73]">
              Manage job orders, brand details, and work order quantities (CNF, CF, CN, Custom Others).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#D2D2D7] bg-white px-3.5 py-2 text-[13px] font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
              title="Refresh from Firestore"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#0071E3] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition hover:bg-[#005bb5] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              + New Job Order
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <Panel padded={false}>
          <div className="flex flex-col gap-4 border-b border-[#D2D2D7] p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E6E73]" />
              <input
                type="text"
                placeholder="Search by JO#, Brand, or Custom Items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[10px] border border-[#D2D2D7] bg-[#F5F5F7] pl-9 pr-4 py-2 text-[13px] text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="h-4 w-4 shrink-0 text-[#6E6E73]" />
              <span className="text-[12px] font-medium text-[#6E6E73]">Status:</span>
              <button
                onClick={() => setStatusFilter("All")}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium transition cursor-pointer",
                  statusFilter === "All"
                    ? "bg-[#0071E3] text-white"
                    : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]",
                )}
              >
                All ({jobOrders.length})
              </button>
              {STATUS_OPTIONS.map((st) => {
                const count = jobOrders.filter((o) => o.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[12px] font-medium transition cursor-pointer",
                      statusFilter === st
                        ? "bg-[#0071E3] text-white"
                        : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]",
                    )}
                  >
                    {st} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-[#FFF2F2] p-4 border-b border-[#FFD0D0] text-[13px] text-[#DC2626]">
              {error}
            </div>
          )}

          {/* Job Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#D2D2D7] bg-[#F5F5F7]/60 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  <th className="px-6 py-3.5">JO# (Document ID)</th>
                  <th className="px-6 py-3.5">Brand Name</th>
                  <th className="px-6 py-3.5">CNF</th>
                  <th className="px-6 py-3.5">CF</th>
                  <th className="px-6 py-3.5">CN</th>
                  <th className="px-6 py-3.5">Others (Custom Items)</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[#6E6E73]">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#0071E3]" />
                      <p className="mt-2 text-[13px]">Loading Job Orders from Firestore...</p>
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[#6E6E73]">
                      <ClipboardList className="mx-auto h-8 w-8 text-[#6E6E73]/60" />
                      <p className="mt-2 text-[15px] font-medium text-[#1D1D1F]">
                        No Job Orders found
                      </p>
                      <p className="text-[13px]">
                        Click "+ New Job Order" above to create one.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-[#F5F5F7]/50"
                    >
                      <td className="px-6 py-4 font-bold text-[#0071E3]">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1D1D1F]">
                        {order.brand}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#1D1D1F]">
                        {order.cnf ?? 0}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#1D1D1F]">
                        {order.cf ?? 0}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#1D1D1F]">
                        {order.cn ?? order.c ?? 0}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#1D1D1F]">
                        {order.otherItems && order.otherItems.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {order.otherItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md bg-[#F5F5F7] px-2 py-0.5 text-[11px] font-medium border border-[#E5E5EA] text-[#1D1D1F]"
                              >
                                <span className="font-semibold text-[#0071E3]">{item.label}:</span>
                                <span className="font-bold">{item.qty}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#A1A1A6]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={mapJobStatusToBadgeKey(order.status)} />
                      </td>
                      <td className="px-6 py-4 text-[#6E6E73]">
                        {order.createdAt.slice(0, 10)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(order)}
                          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#D2D2D7] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7] cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[#0071E3]" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!loading && filteredOrders.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#D2D2D7] px-6 py-4 text-[13px] text-[#6E6E73]">
              <div>
                Showing{" "}
                <span className="font-medium text-[#1D1D1F]">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-[#1D1D1F]">
                  {Math.min(currentPage * pageSize, filteredOrders.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-[#1D1D1F]">
                  {filteredOrders.length}
                </span>{" "}
                entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-[8px] border border-[#D2D2D7] px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F5F7]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-[12px] font-medium text-[#1D1D1F] px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-[8px] border border-[#D2D2D7] px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F5F7]"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Create Modal ────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl border border-[#D2D2D7] my-8">
            <div className="flex items-center justify-between border-b border-[#D2D2D7] pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0071E3]/10 text-[#0071E3]">
                  <Layers className="h-4 w-4" />
                </span>
                <h3 className="text-[17px] font-semibold text-[#1D1D1F]">
                  Create New Job Order
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

              {/* JO# Input */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  JO# (Job Order Number)
                </label>
                <div className="mt-1.5 flex items-center overflow-hidden rounded-[10px] border border-[#D2D2D7] bg-white">
                  <span className="flex h-[38px] select-none items-center border-r border-[#D2D2D7] bg-[#F5F5F7] px-3 text-[12px] font-bold text-[#1D1D1F] shrink-0">
                    JO#
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={joNumberInput}
                    onChange={(e) => setJoNumberInput(e.target.value)}
                    className="h-[38px] w-full bg-transparent px-3 text-[13px] font-medium text-[#1D1D1F] outline-none"
                  />
                </div>
              </div>

              {/* Brand Name Input */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Akxel"
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  className="mt-1.5 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                />
              </div>

              {/* Work Order Standard Quantities: CNF, CF, CN */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  Standard Quantities
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73]">
                      CNF
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={cnfInput}
                      onChange={(e) => setCnfInput(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-bold tabular text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73]">
                      CF
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={cfInput}
                      onChange={(e) => setCfInput(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-bold tabular text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73]">
                      CN
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={cnInput}
                      onChange={(e) => setCnInput(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-bold tabular text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Others Section */}
              <div className="rounded-[12px] border border-[#E5E5EA] bg-[#FBFBFC] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#1D1D1F]">
                    Others
                  </span>
                  <button
                    type="button"
                    onClick={addOtherItemRow}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0071E3] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Other Item
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {otherItemsInput.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Repaint&Shotblast w Requa"
                        value={row.label}
                        onChange={(e) => updateOtherItemRow(idx, "label", e.target.value)}
                        className="h-[36px] flex-1 rounded-[8px] border border-[#D2D2D7] bg-white px-2.5 text-[12px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="0"
                        value={row.qty}
                        onChange={(e) =>
                          updateOtherItemRow(idx, "qty", e.target.value.replace(/\D/g, ""))
                        }
                        className="h-[36px] w-24 rounded-[8px] border border-[#D2D2D7] bg-white px-2.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                      {otherItemsInput.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOtherItemRow(idx)}
                          className="p-1 text-[#FF3B30] hover:bg-red-50 rounded-md cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                  disabled={submitting}
                  className="rounded-[10px] bg-[#0071E3] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#005bb5] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Create Job Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────────────── */}
      {isEditModalOpen && editingJobOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl border border-[#D2D2D7] my-8">
            <div className="flex items-center justify-between border-b border-[#D2D2D7] pb-4">
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">
                Edit Job Order ({editingJobOrder.id})
              </h3>
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

              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Akxel"
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  className="mt-1.5 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                />
              </div>

              {/* Work Order Standard Quantities: CNF, CF, CN */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  Standard Quantities
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73]">
                      CNF
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 0"
                      value={cnfInput}
                      onChange={(e) => setCnfInput(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-bold tabular text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73]">
                      CF
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 0"
                      value={cfInput}
                      onChange={(e) => setCfInput(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-bold tabular text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73]">
                      CN
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 0"
                      value={cnInput}
                      onChange={(e) => setCnInput(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] font-bold tabular text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Others Section */}
              <div className="rounded-[12px] border border-[#E5E5EA] bg-[#FBFBFC] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#1D1D1F]">
                    Others
                  </span>
                  <button
                    type="button"
                    onClick={addOtherItemRow}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0071E3] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Other Item
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {otherItemsInput.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Repaint&Shotblast w Requa"
                        value={row.label}
                        onChange={(e) => updateOtherItemRow(idx, "label", e.target.value)}
                        className="h-[36px] flex-1 rounded-[8px] border border-[#D2D2D7] bg-white px-2.5 text-[12px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="e.g. 20"
                        value={row.qty}
                        onChange={(e) =>
                          updateOtherItemRow(idx, "qty", e.target.value.replace(/\D/g, ""))
                        }
                        className="h-[36px] w-24 rounded-[8px] border border-[#D2D2D7] bg-white px-2.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                      {otherItemsInput.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOtherItemRow(idx)}
                          className="p-1 text-[#FF3B30] hover:bg-red-50 rounded-md cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6E6E73]">
                  Status
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as JobOrderStatus)}
                  className="mt-1.5 w-full rounded-[10px] border border-[#D2D2D7] px-3 py-2 text-[13px] text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
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
                  disabled={submitting}
                  className="rounded-[10px] bg-[#0071E3] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#005bb5] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
