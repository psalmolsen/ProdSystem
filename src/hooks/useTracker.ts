import { useCallback, useEffect, useMemo, useState } from "react";
import type { Bottleneck, CreateEntryInput, JobOrder } from "@/types/tracker";
import {
  createEntry,
  createJobOrder,
  ensureSeed,
  getBottleneckSubProcess,
  getGoodTotalsByStep,
  getTotalsByStep,
  listJobOrders,
} from "@/services/trackerService";

export interface TrackerState {
  jobOrders: JobOrder[];
  selectedJobOrderId: string | null;
  setSelectedJobOrderId: (id: string | null) => void;
  totals: Record<string, number>;
  goodTotals: Record<string, number>;
  overload: Bottleneck | null;
  addEntry: (input: CreateEntryInput) => void;
  addJobOrder: (workOrderNumber: string, brandName: string) => JobOrder;
}

export function useTracker(): TrackerState {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [selectedJobOrderId, setSelectedJobOrderId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    ensureSeed();
    setJobOrders(listJobOrders());
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (jobOrders.length > 0 && !jobOrders.some((o) => o.id === selectedJobOrderId)) {
      setSelectedJobOrderId(jobOrders[0].id);
    }
  }, [jobOrders, selectedJobOrderId]);

  const totals = useMemo(
    () => (selectedJobOrderId ? getTotalsByStep(selectedJobOrderId) : {}),
    [selectedJobOrderId, refreshKey],
  );

  const goodTotals = useMemo(
    () => (selectedJobOrderId ? getGoodTotalsByStep(selectedJobOrderId) : {}),
    [selectedJobOrderId, refreshKey],
  );

  const overload = useMemo(
    () => (selectedJobOrderId ? getBottleneckSubProcess(selectedJobOrderId) : null),
    [selectedJobOrderId, refreshKey],
  );

  const addEntry = useCallback((input: CreateEntryInput) => {
    createEntry(input);
    setRefreshKey((k) => k + 1);
  }, []);

  const addJobOrder = useCallback((workOrderNumber: string, brandName: string) => {
    const order = createJobOrder(workOrderNumber, brandName);
    setJobOrders(listJobOrders());
    setSelectedJobOrderId(order.id);
    return order;
  }, []);

  return {
    jobOrders,
    selectedJobOrderId,
    setSelectedJobOrderId,
    totals,
    overload,
    addEntry,
    addJobOrder,
  };
}
