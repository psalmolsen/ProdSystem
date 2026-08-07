import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import { PageShell, Panel } from "@/components/app/page-shell";
import type { JobOrder } from "@/types/jobOrder";
import { getAllJobOrders } from "@/services/firestore/jobOrderService";
import { getJobOrderProductionStepTotals } from "@/services/firestore/productionService";
import { cn } from "@/lib/utils";

interface JobOrderBrandMetrics {
  jobOrder: JobOrder;
  targetTotal: number;
  deliveredCount: number;
  bufferedCount: number;
  rejectCount: number;
  overallTotal: number;
}

interface BrandGroup {
  brandName: string;
  jobOrders: JobOrderBrandMetrics[];
  totalDelivered: number;
  totalBuffered: number;
  totalReject: number;
  totalOverall: number;
  totalTarget: number;
}

export function BrandSummaryPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [totalsMap, setTotalsMap] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [loadingTotals, setLoadingTotals] = useState(false);

  // Filters
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Load Job Orders from Firestore
  const loadJobOrders = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await getAllJobOrders();
      setJobOrders(orders);
    } catch (err) {
      console.error("Failed to load Job Orders for Brand Summary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobOrders();
  }, [loadJobOrders]);

  // 2. Load step totals for each Job Order from Firestore
  const loadAllStepTotals = useCallback(async () => {
    if (jobOrders.length === 0) return;
    setLoadingTotals(true);
    try {
      const map: Record<string, Record<string, number>> = {};
      await Promise.all(
        jobOrders.map(async (jo) => {
          const stepTotals = await getJobOrderProductionStepTotals(jo.id);
          map[jo.id] = stepTotals;
        }),
      );
      setTotalsMap(map);
    } catch (err) {
      console.error("Failed to load step totals for Brand Summary:", err);
    } finally {
      setLoadingTotals(false);
    }
  }, [jobOrders]);

  useEffect(() => {
    loadAllStepTotals();
  }, [loadAllStepTotals]);

  // Derive distinct brand names from Firestore Job Orders
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    jobOrders.forEach((jo) => {
      if (jo.brand && jo.brand.trim().length > 0) {
        set.add(jo.brand.trim());
      }
    });
    return Array.from(set).sort();
  }, [jobOrders]);

  // Calculate detailed brand metrics for each Job Order
  const joMetricsList = useMemo<JobOrderBrandMetrics[]>(() => {
    return jobOrders.map((jo) => {
      const totals = totalsMap[jo.id] || {};

      const cnf = Number(jo.cnf || 0);
      const cf = Number(jo.cf || 0);
      const cn = Number(jo.cn || jo.c || 0);
      const othersSum = jo.otherItems
        ? jo.otherItems.reduce((acc, item) => acc + Number(item.qty || 0), 0)
        : 0;
      const targetTotal = cnf + cf + cn + othersSum;

      const deliveredCount = totals["Cosmetics::Good"] ?? 0;
      const rejectCount = totals["Cosmetics::Reject"] ?? 0;
      const overallTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);
      const bufferedCount = Math.max(0, overallTotal - deliveredCount - rejectCount);

      return {
        jobOrder: jo,
        targetTotal,
        deliveredCount,
        bufferedCount,
        rejectCount,
        overallTotal,
      };
    });
  }, [jobOrders, totalsMap]);

  // Group Job Orders by Brand and apply filters
  const brandGroups = useMemo<BrandGroup[]>(() => {
    const map = new Map<string, JobOrderBrandMetrics[]>();

    joMetricsList.forEach((m) => {
      const bName = m.jobOrder.brand ? m.jobOrder.brand.trim() : "Standard Brand";
      if (!map.has(bName)) {
        map.set(bName, []);
      }
      map.get(bName)!.push(m);
    });

    const groups: BrandGroup[] = [];

    map.forEach((list, bName) => {
      if (selectedBrandFilter !== "All" && bName.toLowerCase() !== selectedBrandFilter.toLowerCase()) {
        return;
      }

      let filteredList = list;
      if (searchQuery.trim().length > 0) {
        const qLower = searchQuery.trim().toLowerCase();
        filteredList = list.filter(
          (m) =>
            m.jobOrder.id.toLowerCase().includes(qLower) ||
            m.jobOrder.workOrder.toLowerCase().includes(qLower) ||
            m.jobOrder.brand.toLowerCase().includes(qLower),
        );
      }

      if (filteredList.length === 0) return;

      const totalDelivered = filteredList.reduce((acc, m) => acc + m.deliveredCount, 0);
      const totalBuffered = filteredList.reduce((acc, m) => acc + m.bufferedCount, 0);
      const totalReject = filteredList.reduce((acc, m) => acc + m.rejectCount, 0);
      const totalOverall = filteredList.reduce((acc, m) => acc + m.overallTotal, 0);
      const totalTarget = filteredList.reduce((acc, m) => acc + m.targetTotal, 0);

      groups.push({
        brandName: bName,
        jobOrders: filteredList,
        totalDelivered,
        totalBuffered,
        totalReject,
        totalOverall,
        totalTarget,
      });
    });

    return groups.sort((a, b) => a.brandName.localeCompare(b.brandName));
  }, [joMetricsList, selectedBrandFilter, searchQuery]);

  // Grand Totals across all visible brands
  const grandTotals = useMemo(() => {
    return brandGroups.reduce(
      (acc, g) => {
        acc.delivered += g.totalDelivered;
        acc.buffered += g.totalBuffered;
        acc.reject += g.totalReject;
        acc.overall += g.totalOverall;
        acc.target += g.totalTarget;
        return acc;
      },
      { delivered: 0, buffered: 0, reject: 0, overall: 0, target: 0 },
    );
  }, [brandGroups]);

  return (
    <PageShell title="Brand Summary" breadcrumb={["CCB System", "Analytics", "Brand Summary"]}>
      <div className="space-y-6">
        {/* ── Top Executive KPI Overview Cards (Monochrome & Unshaded) ────────────── */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Delivered Tanks */}
          <div className="rounded-[16px] border border-[#D2D2D7] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
              Delivered Tanks
            </span>
            <p className="mt-2 text-[30px] font-bold tabular tracking-tight text-[#1D1D1F]">
              {grandTotals.delivered}
            </p>
            <p className="mt-1 text-[12px] font-medium text-[#6E6E73]">
              Passed finished good tanks
            </p>
          </div>

          {/* Card 2: Buffered Tanks */}
          <div className="rounded-[16px] border border-[#D2D2D7] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
              Buffered Tanks
            </span>
            <p className="mt-2 text-[30px] font-bold tabular tracking-tight text-[#1D1D1F]">
              {grandTotals.buffered}
            </p>
            <p className="mt-1 text-[12px] font-medium text-[#6E6E73]">
              In-process across stations
            </p>
          </div>

          {/* Card 3: Reject Tanks */}
          <div className="rounded-[16px] border border-[#D2D2D7] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
              Reject Tanks
            </span>
            <p className="mt-2 text-[30px] font-bold tabular tracking-tight text-[#1D1D1F]">
              {grandTotals.reject}
            </p>
            <p className="mt-1 text-[12px] font-medium text-[#6E6E73]">
              Defective / scrapped tanks
            </p>
          </div>

          {/* Card 4: Overall Total Tanks */}
          <div className="rounded-[16px] border border-[#D2D2D7] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
              Overall Total
            </span>
            <p className="mt-2 text-[30px] font-bold tabular tracking-tight text-[#1D1D1F]">
              {grandTotals.overall}
            </p>
            <p className="mt-1 text-[12px] font-medium text-[#6E6E73]">
              Grand total tanks ({grandTotals.target} target)
            </p>
          </div>
        </section>

        {/* ── Toolbar: Brand Filter & Search ───────────────────────────────── */}
        <Panel
          title="Brand Division Breakdown"
          description="Tank totals (Delivered, Buffered, Reject, Overall) categorized per Brand Name."
          actions={
            <button
              type="button"
              onClick={() => {
                loadJobOrders();
                loadAllStepTotals();
              }}
              className="btn-secondary flex items-center gap-2 cursor-pointer text-[12px]"
              title="Refresh Firestore totals"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadingTotals ? "animate-spin" : "")} />
              <span>Sync Totals</span>
            </button>
          }
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E6E73]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search JO#, Work Order, or Brand Name..."
                className="h-[40px] w-full rounded-[10px] border border-[#D2D2D7] bg-[#F5F5F7] pl-10 pr-4 text-[13px] font-medium text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white"
              />
            </div>

            {/* Brand Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#6E6E73]" />
              <label htmlFor="brand-filter" className="text-[12px] font-bold text-[#6E6E73]">
                Filter Brand:
              </label>
              <select
                id="brand-filter"
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="h-[40px] min-w-[180px] rounded-[10px] border border-[#D2D2D7] bg-white px-3 text-[13px] font-bold text-[#1D1D1F] outline-none focus:border-[#0071E3] cursor-pointer"
              >
                <option value="All">All Brands ({availableBrands.length})</option>
                {availableBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Brand Division Groups ────────────────────────────────────── */}
          {loading ? (
            <div className="grid min-h-[200px] place-items-center text-[#6E6E73]">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-[#0071E3]" />
                <span className="text-[14px] font-medium">Loading Brand Summary from Firestore...</span>
              </div>
            </div>
          ) : brandGroups.length === 0 ? (
            <div className="grid min-h-[160px] place-items-center py-8 text-center text-[#6E6E73]">
              <div>
                <p className="font-semibold text-[#1D1D1F]">No matching Brand records found</p>
                <p className="text-[12px] mt-1">Try adjusting your brand filter or search query.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {brandGroups.map((group) => (
                <div
                  key={group.brandName}
                  className="overflow-hidden rounded-[14px] border border-[#D2D2D7] bg-white"
                >
                  {/* Clean Brand Header Banner */}
                  <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D2D2D7] bg-[#FBFBFC] px-5 py-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[16px] font-bold text-[#1D1D1F]">
                          {group.brandName}
                        </h3>
                        <span className="rounded-md border border-[#D2D2D7] bg-white px-2 py-0.5 text-[11px] font-bold text-[#6E6E73]">
                          {group.jobOrders.length} JOs
                        </span>
                      </div>
                      <p className="text-[12px] font-medium text-[#6E6E73] mt-0.5">
                        Target Demand: <strong>{group.totalTarget} units</strong>
                      </p>
                    </div>

                    {/* Right Clean Mini Stat Pills for this Brand (Monochrome & Unshaded) */}
                    <div className="flex flex-wrap items-center gap-3 text-[12px]">
                      <div className="rounded-[8px] border border-[#D2D2D7] bg-white px-3 py-1 text-right">
                        <span className="block text-[10px] font-bold uppercase text-[#6E6E73]">Delivered</span>
                        <span className="text-[13px] font-bold text-[#1D1D1F]">{group.totalDelivered}</span>
                      </div>

                      <div className="rounded-[8px] border border-[#D2D2D7] bg-white px-3 py-1 text-right">
                        <span className="block text-[10px] font-bold uppercase text-[#6E6E73]">Buffered</span>
                        <span className="text-[13px] font-bold text-[#1D1D1F]">{group.totalBuffered}</span>
                      </div>

                      <div className="rounded-[8px] border border-[#D2D2D7] bg-white px-3 py-1 text-right">
                        <span className="block text-[10px] font-bold uppercase text-[#6E6E73]">Reject</span>
                        <span className="text-[13px] font-bold text-[#1D1D1F]">{group.totalReject}</span>
                      </div>

                      <div className="rounded-[8px] border border-[#D2D2D7] bg-white px-3 py-1 text-right">
                        <span className="block text-[10px] font-bold uppercase text-[#6E6E73]">Overall</span>
                        <span className="text-[13px] font-bold text-[#1D1D1F]">{group.totalOverall}</span>
                      </div>
                    </div>
                  </header>

                  {/* Brand Job Orders Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-[#D2D2D7] bg-white text-[11px] font-bold uppercase tracking-[0.05em] text-[#6E6E73]">
                          <th className="px-5 py-3 min-w-[110px]">JO#</th>
                          <th className="px-5 py-3 min-w-[120px]">Work Order</th>
                          <th className="px-5 py-3 min-w-[220px]">Target Requirements</th>
                          <th className="px-5 py-3 min-w-[100px] text-right">Delivered</th>
                          <th className="px-5 py-3 min-w-[100px] text-right">Buffered</th>
                          <th className="px-5 py-3 min-w-[100px] text-right">Reject</th>
                          <th className="px-5 py-3 min-w-[110px] text-right">Overall Total</th>
                          <th className="px-5 py-3 min-w-[90px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5EA]">
                        {group.jobOrders.map((m) => {
                          const reqParts: string[] = [];
                          reqParts.push(`CNF: ${m.jobOrder.cnf || 0}`);
                          reqParts.push(`CF: ${m.jobOrder.cf || 0}`);
                          reqParts.push(`CN: ${m.jobOrder.cn || m.jobOrder.c || 0}`);
                          if (m.jobOrder.otherItems && m.jobOrder.otherItems.length > 0) {
                            m.jobOrder.otherItems.forEach((i) => reqParts.push(`${i.label}: ${i.qty}`));
                          }

                          return (
                            <tr key={m.jobOrder.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-[#0071E3]">
                                {m.jobOrder.id}
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-[#1D1D1F]">
                                {m.jobOrder.workOrder}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-[#1D1D1F]">
                                {reqParts.join(" · ")}
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold text-[#1D1D1F]">
                                {m.deliveredCount}
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold text-[#1D1D1F]">
                                {m.bufferedCount}
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold text-[#1D1D1F]">
                                {m.rejectCount}
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold text-[#1D1D1F]">
                                {m.overallTotal}
                              </td>
                              <td className="px-5 py-3.5 font-bold text-[11px] text-[#34C759]">
                                {m.jobOrder.status || "Active"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
