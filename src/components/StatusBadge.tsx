import { STATUS_LABELS, isStatus } from "@/lib/constants";

const COLORS: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-800",
  LISTED: "bg-emerald-200 text-emerald-900",
  RESERVED: "bg-amber-200 text-amber-900",
  SOLD: "bg-blue-200 text-blue-900",
  WITHDRAWN: "bg-rose-200 text-rose-900",
};

export function StatusBadge({ status }: { status: string }) {
  const label = isStatus(status) ? STATUS_LABELS[status] : status;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        COLORS[status] ?? "bg-slate-200 text-slate-800"
      }`}
    >
      {label}
    </span>
  );
}
