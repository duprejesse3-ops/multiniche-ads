import { Link } from "@tanstack/react-router";
import { publisherById } from "@/lib/network";
import { formatMoney } from "@/lib/format";
import type { AuctionEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ExchangeTape({
  tape,
  empty,
}: {
  tape: AuctionEvent[];
  empty?: string;
}) {
  if (!tape.length) {
    return (
      <p className="py-8 text-sm text-muted">
        {empty ?? "The tape is empty. Open the exchange or visit a publisher."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {tape.slice(0, 18).map((e) => {
        const pub = publisherById(e.publisherId);
        const won = e.outcome === "won";
        return (
          <li key={e.id} className="flex items-start gap-3 py-2.5">
            <span
              className={cn(
                "mt-1 size-1.5 shrink-0 rounded-full",
                won ? (e.owned ? "bg-success" : "bg-muted") : "bg-subtle",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                {won ? (
                  <>
                    <span className="text-fg">{e.brand}</span>
                    <span className="text-subtle"> won </span>
                    <span className="text-muted">
                      {pub?.name ?? e.siteHost ?? e.publisherId}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">
                    No fill · {pub?.name ?? e.siteHost ?? e.publisherId}
                  </span>
                )}
              </p>
              {won && e.headline ? (
                <p className="truncate text-xs text-subtle">{e.headline}</p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs tabular-nums text-muted">
                {won ? formatMoney(e.price, 2) : "—"}
              </p>
              <p className="text-[10px] tabular-nums text-subtle">
                {won ? `q ${e.quality.toFixed(2)}` : ""}
                {e.clicked ? " · clk" : ""}
                {e.ran ? " · run" : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CampaignLink({ id, children }: { id: string; children: string }) {
  return (
    <Link to="/campaigns/$id" params={{ id }} className="hover:underline">
      {children}
    </Link>
  );
}
