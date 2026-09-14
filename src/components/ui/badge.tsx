import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/types";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-raised px-2 py-0.5 text-xs text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusClass: Record<CampaignStatus, string> = {
  active: "border-success/30 bg-success/10 text-success",
  paused: "border-warn/30 bg-warn/10 text-warn",
  ended: "border-border bg-raised text-muted",
  draft: "border-border bg-raised text-subtle",
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const label =
    status === "active"
      ? "In flight"
      : status === "paused"
        ? "Paused"
        : status === "ended"
          ? "Ended"
          : "Draft";
  return <Badge className={statusClass[status]}>{label}</Badge>;
}
