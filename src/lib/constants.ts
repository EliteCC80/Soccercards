export const STATUSES = [
  "DRAFT",
  "LISTED",
  "RESERVED",
  "SOLD",
  "WITHDRAWN",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  DRAFT: "Concept",
  LISTED: "Online",
  RESERVED: "Gereserveerd",
  SOLD: "Verkocht",
  WITHDRAWN: "Ingetrokken",
};

export const CONDITIONS = ["MINT", "NM", "EX", "GOOD"] as const;

export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_LABELS: Record<Condition, string> = {
  MINT: "Mint",
  NM: "Near Mint",
  EX: "Excellent",
  GOOD: "Good",
};

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

export function isCondition(value: string): value is Condition {
  return (CONDITIONS as readonly string[]).includes(value);
}
