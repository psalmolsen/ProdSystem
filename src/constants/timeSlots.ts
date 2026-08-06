export const TIME_SLOTS = ["6-8", "8-10", "11-1", "1-3", "3-5"] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];
