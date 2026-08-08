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
import type { JobOrder, JobOrderStatus, OtherWorkOrderItem, CylinderVariant } from "@/types/jobOrder";
import {
  createJobOrder,
  getAllJobOrders,
  updateJobOrder,
  deleteJobOrder,
} from "@/services/firestore/jobOrderService";
import type { StatusKey } from "@/lib/ccb-data";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: JobOrderStatus[] = ["Active", "Pending", "Completed", "Cancelled"];
const CYLINDER_VARIANTS: CylinderVariant[] = ["11 kg", "22 kg", "50 kg"];

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  const [cylinderSizeInput, setCylinderSizeInput] = useState<CylinderVariant>("11 kg");

  // 11kg nested breakdown
  const [v11Cnf, setV11Cnf] = useState("");
  const [v11Cf, setV11Cf] = useState("");
  const [v11Cn, setV11Cn] = useState("");

  // 22kg nested breakdown
  const [v22Cnf, setV22Cnf] = useState("");
  const [v22Cf, setV22Cf] = useState("");
  const [v22Cn, setV22Cn] = useState("");

  // 50kg nested breakdown
  const [v50Cnf, setV50Cnf] = useState("");
  const [v50Cf, setV50Cf] = useState("");
  const [v50Cn, setV50Cn] = useState("");

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

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Are you sure you want to delete Job Order ${orderId}?`)) return;

    setDeletingId(orderId);
    try {
      await deleteJobOrder(orderId);
      await loadData();
    } catch (err) {
      console.error("Failed to delete Job Order:", err);
      setError("Failed to delete Job Order from Firestore.");
    } finally {
      setDeletingId(null);
    }
  };

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
        (order.cylinderSize && order.cylinderSize.toLowerCase().includes(q)) ||
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
    setCylinderSizeInput("11 kg");
    setV11Cnf(""); setV11Cf(""); setV11Cn("");
    setV22Cnf(""); setV22Cf(""); setV22Cn("");
    setV50Cnf(""); setV50Cf(""); setV50Cn("");
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
    setCylinderSizeInput(order.cylinderSize || "11 kg");

    setV11Cnf(order.variants?.size11kg?.cnf ? String(order.variants.size11kg.cnf) : (order.cnf ? String(order.cnf) : ""));
    setV11Cf(order.variants?.size11kg?.cf ? String(order.variants.size11kg.cf) : (order.cf ? String(order.cf) : ""));
    setV11Cn(order.variants?.size11kg?.cn ? String(order.variants.size11kg.cn) : (order.cn ? String(order.cn) : (order.c ? String(order.c) : "")));

    setV22Cnf(order.variants?.size22kg?.cnf ? String(order.variants.size22kg.cnf) : "");
    setV22Cf(order.variants?.size22kg?.cf ? String(order.variants.size22kg.cf) : "");
    setV22Cn(order.variants?.size22kg?.cn ? String(order.variants.size22kg.cn) : "");

    setV50Cnf(order.variants?.size50kg?.cnf ? String(order.variants.size50kg.cnf) : "");
    setV50Cf(order.variants?.size50kg?.cf ? String(order.variants.size50kg.cf) : "");
    setV50Cn(order.variants?.size50kg?.cn ? String(order.variants.size50kg.cn) : "");

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

    const size11Total = (Number(v11Cnf) || 0) + (Number(v11Cf) || 0) + (Number(v11Cn) || 0);
    const size22Total = (Number(v22Cnf) || 0) + (Number(v22Cf) || 0) + (Number(v22Cn) || 0);
    const size50Total = (Number(v50Cnf) || 0) + (Number(v50Cf) || 0) + (Number(v50Cn) || 0);

    const totalCnf = (Number(v11Cnf) || 0) + (Number(v22Cnf) || 0) + (Number(v50Cnf) || 0);
    const totalCf = (Number(v11Cf) || 0) + (Number(v22Cf) || 0) + (Number(v50Cf) || 0);
    const totalCn = (Number(v11Cn) || 0) + (Number(v22Cn) || 0) + (Number(v50Cn) || 0);

    setSubmitting(true);
    setFormError("");
    try {
      await createJobOrder({
        joNumber: joNumberInput.trim() || undefined,
        brand: brandInput.trim() || "Standard",
        cylinderSize: cylinderSizeInput,
        variants: {
          size11kg: { cnf: v11Cnf, cf: v11Cf, cn: v11Cn },
          size22kg: { cnf: v22Cnf, cf: v22Cf, cn: v22Cn },
          size50kg: { cnf: v50Cnf, cf: v50Cf, cn: v50Cn },
        },
        size11kg: size11Total,
        size22kg: size22Total,
        size50kg: size50Total,
        cnf: totalCnf,
        cf: totalCf,
        cn: totalCn,
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

    const size11Total = (Number(v11Cnf) || 0) + (Number(v11Cf) || 0) + (Number(v11Cn) || 0);
    const size22Total = (Number(v22Cnf) || 0) + (Number(v22Cf) || 0) + (Number(v22Cn) || 0);
    const size50Total = (Number(v50Cnf) || 0) + (Number(v50Cf) || 0) + (Number(v50Cn) || 0);

    const totalCnf = (Number(v11Cnf) || 0) + (Number(v22Cnf) || 0) + (Number(v50Cnf) || 0);
    const totalCf = (Number(v11Cf) || 0) + (Number(v22Cf) || 0) + (Number(v50Cf) || 0);
    const totalCn = (Number(v11Cn) || 0) + (Number(v22Cn) || 0) + (Number(v50Cn) || 0);

    setSubmitting(true);
    setFormError("");
    try {
      await updateJobOrder(editingJobOrder.id, {
        brand: brandInput,
        cylinderSize: cylinderSizeInput,
        variants: {
          size11kg: { cnf: v11Cnf, cf: v11Cf, cn: v11Cn },
          size22kg: { cnf: v22Cnf, cf: v22Cf, cn: v22Cn },
          size50kg: { cnf: v50Cnf, cf: v50Cf, cn: v50Cn },
        },
        size11kg: size11Total,
        size22kg: size22Total,
        size50kg: size50Total,
        cnf: totalCnf,
        cf: totalCf,
        cn: totalCn,
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
                  <th className="px-6 py-3.5">Capacity Variants & Custom Services Breakdown</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#6E6E73]">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#0071E3]" />
                      <p className="mt-2 text-[13px]">Loading Job Orders from Firestore...</p>
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#6E6E73]">
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
                  paginatedOrders.map((order) => {
                    const v11 = order.variants?.size11kg;
                    const v22 = order.variants?.size22kg;
                    const v50 = order.variants?.size50kg;

                    return (
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
                        <td className="px-6 py-4 text-[12px]">
                          <div className="space-y-1.5 min-w-[280px]">
                            {v11 && (Number(v11.cnf || 0) > 0 || Number(v11.cf || 0) > 0 || Number(v11.cn || 0) > 0) && (
                              <div className="grid grid-cols-[45px_minmax(75px,auto)_minmax(60px,auto)_minmax(60px,auto)] items-center gap-x-3 text-[12px]">
                                <span className="font-bold text-[#0071E3]">11kg:</span>
                                <span><span className="text-[#6E6E73] font-medium">CNF:</span> <span className="font-semibold text-[#1D1D1F]">{v11.cnf || 0}</span></span>
                                <span><span className="text-[#6E6E73] font-medium">CF:</span> <span className="font-semibold text-[#1D1D1F]">{v11.cf || 0}</span></span>
                                <span><span className="text-[#6E6E73] font-medium">CN:</span> <span className="font-semibold text-[#1D1D1F]">{v11.cn || 0}</span></span>
                              </div>
                            )}
                            {v22 && (Number(v22.cnf || 0) > 0 || Number(v22.cf || 0) > 0 || Number(v22.cn || 0) > 0) && (
                              <div className="grid grid-cols-[45px_minmax(75px,auto)_minmax(60px,auto)_minmax(60px,auto)] items-center gap-x-3 text-[12px]">
                                <span className="font-bold text-[#0071E3]">22kg:</span>
                                <span><span className="text-[#6E6E73] font-medium">CNF:</span> <span className="font-semibold text-[#1D1D1F]">{v22.cnf || 0}</span></span>
                                <span><span className="text-[#6E6E73] font-medium">CF:</span> <span className="font-semibold text-[#1D1D1F]">{v22.cf || 0}</span></span>
                                <span><span className="text-[#6E6E73] font-medium">CN:</span> <span className="font-semibold text-[#1D1D1F]">{v22.cn || 0}</span></span>
                              </div>
                            )}
                            {v50 && (Number(v50.cnf || 0) > 0 || Number(v50.cf || 0) > 0 || Number(v50.cn || 0) > 0) && (
                              <div className="grid grid-cols-[45px_minmax(75px,auto)_minmax(60px,auto)_minmax(60px,auto)] items-center gap-x-3 text-[12px]">
                                <span className="font-bold text-[#0071E3]">50kg:</span>
                                <span><span className="text-[#6E6E73] font-medium">CNF:</span> <span className="font-semibold text-[#1D1D1F]">{v50.cnf || 0}</span></span>
                                <span><span className="text-[#6E6E73] font-medium">CF:</span> <span className="font-semibold text-[#1D1D1F]">{v50.cf || 0}</span></span>
                                <span><span className="text-[#6E6E73] font-medium">CN:</span> <span className="font-semibold text-[#1D1D1F]">{v50.cn || 0}</span></span>
                              </div>
                            )}
                            {!v11 && !v22 && !v50 && (
                              <div className="grid grid-cols-[45px_minmax(75px,auto)_minmax(60px,auto)_minmax(60px,auto)] items-center gap-x-3 text-[12px]">
                                <span className="font-bold text-[#0071E3]">11kg:</span>
                                <span><span className="text-[#6E6E73] font-medium">CNF:</span> <span className="font-semibold text-[#1D1D1F]">{order.cnf || 0}</span></span>
                                <span><span className="text-[#6E6E73] font-medium">CF:</span> <span className="font-semibold text-[#1D1D1F]">{order.cf || 0}</span></span>
                                <span><span className="text-[#6E6E73] font-medium">CN:</span> <span className="font-semibold text-[#1D1D1F]">{order.cn || order.c || 0}</span></span>
                              </div>
                            )}

                            {order.otherItems && order.otherItems.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#E5E5EA] flex-wrap text-[11px]">
                                <span className="font-bold text-[#6E6E73]">Custom Services:</span>
                                {order.otherItems.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 rounded-md bg-[#F5F5F7] px-2 py-0.5 font-medium border border-[#E5E5EA] text-[#1D1D1F]"
                                  >
                                    <span className="font-semibold text-[#0071E3]">{item.label}:</span>
                                    <span className="font-bold">{item.qty}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={mapJobStatusToBadgeKey(order.status)} />
                      </td>
                      <td className="px-6 py-4 text-[#6E6E73]">
                        {order.createdAt.slice(0, 10)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(order)}
                            className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#D2D2D7] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7] cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#0071E3]" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deletingId === order.id}
                            className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#FF3B30]/30 bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#FF3B30] transition hover:bg-[#FFF2F2] hover:border-[#FF3B30] cursor-pointer disabled:opacity-50"
                            title="Delete Job Order"
                          >
                            {deletingId === order.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#FF3B30]" />
                            ) : (
                              <>
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </>
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

              {/* Nested Cylinder Capacity Breakdown (11kg, 22kg, 50kg -> CNF, CF, CN) */}
              <div className="space-y-3 rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#1D1D1F]">
                  Work Order Breakdown by Tank Capacity
                </p>

                {/* 11 kg Variant Section */}
                <div className="rounded-[10px] border border-[#D2D2D7] bg-white p-3 space-y-2">
                  <span className="text-[12px] font-extrabold text-[#0071E3]">11 kg Tank Variant</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CNF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v11Cnf} onChange={(e) => setV11Cnf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v11Cf} onChange={(e) => setV11Cf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CN</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v11Cn} onChange={(e) => setV11Cn(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  </div>
                </div>

                {/* 22 kg Variant Section */}
                <div className="rounded-[10px] border border-[#D2D2D7] bg-white p-3 space-y-2">
                  <span className="text-[12px] font-extrabold text-[#0071E3]">22 kg Tank Variant</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CNF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v22Cnf} onChange={(e) => setV22Cnf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v22Cf} onChange={(e) => setV22Cf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CN</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v22Cn} onChange={(e) => setV22Cn(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  </div>
                </div>

                {/* 50 kg Variant Section */}
                <div className="rounded-[10px] border border-[#D2D2D7] bg-white p-3 space-y-2">
                  <span className="text-[12px] font-extrabold text-[#0071E3]">50 kg Tank Variant</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CNF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v50Cnf} onChange={(e) => setV50Cnf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v50Cf} onChange={(e) => setV50Cf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CN</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v50Cn} onChange={(e) => setV50Cn(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  </div>
                </div>
              </div>



              {/* Custom Services Section */}
              <div className="rounded-[12px] border border-[#E5E5EA] bg-[#FBFBFC] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#1D1D1F]">
                    Custom Services
                  </span>
                  <button
                    type="button"
                    onClick={addOtherItemRow}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0071E3] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Custom Service
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

              {/* Nested Cylinder Capacity Breakdown (11kg, 22kg, 50kg -> CNF, CF, CN) */}
              <div className="space-y-3 rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#1D1D1F]">
                  Work Order Breakdown by Tank Capacity
                </p>

                {/* 11 kg Variant Section */}
                <div className="rounded-[10px] border border-[#D2D2D7] bg-white p-3 space-y-2">
                  <span className="text-[12px] font-extrabold text-[#0071E3]">11 kg Tank Variant</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CNF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v11Cnf} onChange={(e) => setV11Cnf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v11Cf} onChange={(e) => setV11Cf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CN</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v11Cn} onChange={(e) => setV11Cn(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  </div>
                </div>

                {/* 22 kg Variant Section */}
                <div className="rounded-[10px] border border-[#D2D2D7] bg-white p-3 space-y-2">
                  <span className="text-[12px] font-extrabold text-[#0071E3]">22 kg Tank Variant</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CNF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v22Cnf} onChange={(e) => setV22Cnf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v22Cf} onChange={(e) => setV22Cf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CN</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v22Cn} onChange={(e) => setV22Cn(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  </div>
                </div>

                {/* 50 kg Variant Section */}
                <div className="rounded-[10px] border border-[#D2D2D7] bg-white p-3 space-y-2">
                  <span className="text-[12px] font-extrabold text-[#0071E3]">50 kg Tank Variant</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CNF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v50Cnf} onChange={(e) => setV50Cnf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CF</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v50Cf} onChange={(e) => setV50Cf(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73]">CN</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                        value={v50Cn} onChange={(e) => setV50Cn(e.target.value.replace(/\D/g, ""))}
                        className="mt-1 w-full rounded-[8px] border border-[#D2D2D7] px-2.5 py-1.5 text-[12px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                      />
                    </div>
                  </div>
                </div>
              </div>



              {/* Custom Services Section */}
              <div className="rounded-[12px] border border-[#E5E5EA] bg-[#FBFBFC] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#1D1D1F]">
                    Custom Services
                  </span>
                  <button
                    type="button"
                    onClick={addOtherItemRow}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0071E3] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Custom Service
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
