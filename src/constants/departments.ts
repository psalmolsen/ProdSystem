export const DEPARTMENTS = [
  "CTC1",
  "Hotworks",
  "CTC2",
  "Painting",
  "Cosmetics",
  "Others",
] as const;

export type DepartmentName = (typeof DEPARTMENTS)[number];
