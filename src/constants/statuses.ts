export const JOB_ORDER_STATUSES = ["Pending", "Active", "Completed", "Cancelled"] as const;

export type JobOrderStatus = (typeof JOB_ORDER_STATUSES)[number];
