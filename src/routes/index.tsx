import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { todayISO } from "@/lib/auction";
import { PenLine, Play, Radio, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ExchangeTape } from "@/components/exchange-tape";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import {
  formatCompact,
  formatMoney,
  formatPct,
  todayStat,
  winRate,
} from "@/lib/format";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const campaigns = useDesk((s) => s.campaigns);
  const tape = useDesk((s) => s.tape);
  const exchangeOpen = useDesk((s) => s.exchangeOpen);
  const setExchangeOpen = useDesk((s) => s.setExchangeOpen);
  const pump = useDesk((s) => s.pump);
  const [filter, setFilter] = useState<"house" | "network" | "all">("house");

  const house = campaigns.filter((c) => c.owned);
  const visible =
    filter === "house" ? house : filter === "network" ? campaigns.filter((c) => !c.owned) : campaigns;

  const live = useMemo(() => {
    const stats = house.map(todayStat);
    return stats.reduce(
      (a, s) => ({
        impressions: a.impressions + s.impressions,
        clicks: a.clicks + s.clicks,
        runs: a.runs + (s.runs ?? 0),
        spend: a.spend + s.spend,
        conversions: a.conversions + s.conversions,
        revenue: a.revenue + s.revenue,
      }),
      { impressions: 0, clicks: 0, runs: 0, spend: 0, conversions: 0, revenue: 0 },
    );
  }, [house]);

  const liveRoas = live.spend ? live.revenue / live.spend : 0;

  function openExchange() {
    if (!exchangeOpen) {
      pump(24);
      setExchangeOpen(true);
      toast.success("Exchange is open. Auctions fire on this network.");
    } else {
      setExchangeOpen(false);
      toast.message("Exchange paused. Visiting a publisher still auctions.");
    }
  }

  const today = todayISO();
  const agentRunsToday = useMemo(
    () =>
      tape.filter(
        (e) => e.ran && e.ts.slice(0, 10) === today && (e.slotId === "s_agent_offer" || e.slotId.startsWith("s_agent")),
      ).length,
    [tape, today],
  );

  return (
    <AppShell
      eyebrow={format(new Date(), "EEEE d MMMM")}
      title="Exchange"
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={openExchange}>
            {exchangeOpen ? <Square /> : <Radio />}
            {exchangeOpen ? "Pause tape" : "Open exchange"}
          </Button>
          <Button asChild>
            <Link to="/create">
              <PenLine />
              Compose
            </Link>
          </Button>
        </div>
      }
    >
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
        Google sells a click. ChatGPT sells a chat — both inside their walls. This exchange sells a{" "}
        <span className="text-fg">completed job of the SKU, on the page they are reading</span>. Humans
        tap Run it on this page. Agents POST the task. Same book. House advertiser is{" "}
        <a href="https://multinicheai.com" className="text-fg underline-offset-2 hover:underline">
          multinicheai.com
        </a>
        . You are not buying Google inventory.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Spend today"
          value={formatMoney(live.spend, 2)}
          hint={exchangeOpen ? "House · live auctions" : "House · opens with the tape"}
          live={exchangeOpen}
          className="rise"
        />
        <Kpi
          label="Impressions"
          value={formatCompact(live.impressions)}
          hint={`${live.clicks} clicks · ${live.runs} spec runs`}
          className="rise-2"
        />
        <Kpi
          label="Run rate"
          value={formatPct(live.impressions ? live.runs / live.impressions : 0)}
          hint={
            agentRunsToday
              ? `${agentRunsToday} via the agent protocol`
              : "They ran the SKU on the page"
          }
          className="rise-3"
        />
        <Kpi
          label="ROAS"
          value={liveRoas ? `${liveRoas.toFixed(1)}x` : "—"}
          hint={formatMoney(live.revenue, 0) + " attributed"}
          className="rise-4"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">Auction tape</h2>
              <p className="text-sm text-muted">
                Second-price · bid × quality. Billable event is a page-native spec run.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  pump(40);
                  toast.success("40 visitors sent through the network.");
                }}
              >
                <Play />
                Send 40 visitors
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <ExchangeTape tape={tape} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-xl">How this works</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm leading-relaxed text-muted">
            <p>
              1. Each campaign carries a spec — the first prompt of the SKU. Quality is overlap
              with the publisher (or the Findr query). Specs outrank banners.
            </p>
            <p>
              2. Highest bid × quality wins. The unit does not chat about the product. It{" "}
              <span className="text-fg">runs the product on this page</span>. Agents POST a task to{" "}
              <code className="text-fg">/api/ads/run</code> and get the same job back as JSON.
            </p>
            <p>
              3. A run bills a slice of CPC and they keep the spec. A click still 302s to
              multinicheai.com. Tape traffic is bound, not live, so it does not spend the desk.
            </p>
            <p>
              Pause Deep Work, raise Agent Studio’s bid, or resume Code Review Digest — the next
              tag fire uses it.
            </p>
            <Link to="/inventory" className="inline-block text-fg underline-offset-2 hover:underline">
              Get the tag →
            </Link>
          </CardBody>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl">Campaigns</h2>
          <div className="flex gap-1">
            {(["house", "network", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "h-9 rounded-full px-3 text-xs capitalize",
                  filter === f ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
                )}
              >
                {f === "house" ? "House" : f === "network" ? "Competitors" : "All"}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_6.5rem_5.5rem_5rem_6rem_6rem] gap-3 border-b border-border bg-surface px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-subtle md:grid">
            <span>Name</span>
            <span>Status</span>
            <span className="text-right">Bid</span>
            <span className="text-right">Win</span>
            <span className="text-right">Spend</span>
            <span className="text-right">Impr</span>
          </div>
          <ul>
            {visible.map((c) => {
              const t = todayStat(c);
              return (
                <li key={c.id} className="border-b border-border last:border-0">
                  <Link
                    to="/campaigns/$id"
                    params={{ id: c.id }}
                    className="grid grid-cols-1 gap-2 px-4 py-3.5 transition-colors duration-150 hover:bg-raised/40 md:grid-cols-[minmax(0,1.5fr)_6.5rem_5.5rem_5rem_6rem_6rem] md:items-center md:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-subtle">
                        {c.owned ? "House" : "Network"} · {c.brand}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                    <p className="tabular-nums text-sm md:text-right">{formatMoney(c.cpcBid, 2)}</p>
                    <p className="tabular-nums text-sm text-muted md:text-right">
                      {formatPct(winRate(tape, c.id), 0)}
                    </p>
                    <p className="tabular-nums text-sm md:text-right">{formatMoney(t.spend, 2)}</p>
                    <p className="tabular-nums text-sm text-muted md:text-right">
                      {t.impressions}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  hint,
  live,
  className,
}: {
  label: string;
  value: string;
  hint: string;
  live?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardBody className="pt-5">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-subtle">
          {live ? <span className="live-dot size-1.5 rounded-full bg-success" /> : null}
          {label}
        </p>
        <p className="mt-2 font-display text-3xl tabular-nums tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </CardBody>
    </Card>
  );
}
