import type { AuctionEvent, Campaign, DailyStat } from "./types";
import { todayISO } from "./auction";

export function formatMoney(n: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPct(n: number, digits = 2) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function rollup(stats: DailyStat[]) {
  return stats.reduce(
    (acc, s) => ({
      impressions: acc.impressions + s.impressions,
      clicks: acc.clicks + s.clicks,
      spend: acc.spend + s.spend,
      conversions: acc.conversions + s.conversions,
      revenue: acc.revenue + s.revenue,
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 },
  );
}

export function campaignRollup(c: Campaign) {
  return rollup(c.stats);
}

export function todayStat(c: Campaign): DailyStat {
  const date = todayISO();
  return (
    c.stats.find((s) => s.date === date) ?? {
      date,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0,
    }
  );
}

export function ctr(stats: DailyStat[]) {
  const r = rollup(stats);
  return r.impressions === 0 ? 0 : r.clicks / r.impressions;
}

export function roas(stats: DailyStat[]) {
  const r = rollup(stats);
  return r.spend === 0 ? 0 : r.revenue / r.spend;
}

export function cpc(stats: DailyStat[]) {
  const r = rollup(stats);
  return r.clicks === 0 ? 0 : r.spend / r.clicks;
}

export function cpa(stats: DailyStat[]) {
  const r = rollup(stats);
  return r.conversions === 0 ? 0 : r.spend / r.conversions;
}

export function winRate(tape: AuctionEvent[], campaignId: string) {
  let appeared = 0;
  let won = 0;
  for (const e of tape) {
    if (e.campaignId === campaignId) {
      appeared += 1;
      won += 1;
    } else if (e.rivals.some((r) => r.campaignId === campaignId)) {
      appeared += 1;
    }
  }
  return appeared === 0 ? 0 : won / appeared;
}

export function objectiveLabel(o: Campaign["objective"]) {
  return (
    {
      awareness: "Awareness",
      traffic: "Traffic",
      conversions: "Conversions",
      leads: "Leads",
    } as const
  )[o];
}

export function platformLabel(p: Campaign["platforms"][number]) {
  return (
    {
      search: "Search",
      social: "Social",
      display: "Display",
      video: "Video",
    } as const
  )[p];
}

export function statusLabel(s: Campaign["status"]) {
  return (
    {
      draft: "Draft",
      active: "In flight",
      paused: "Paused",
      ended: "Ended",
    } as const
  )[s];
}
