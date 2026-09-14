import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/format";
import type { Publisher, Slot } from "@/lib/network";
import { useDesk } from "@/lib/store";
import type { AdCreative, AuctionEvent, Campaign } from "@/lib/types";
import { cn } from "@/lib/utils";

type Fill = {
  fill: boolean;
  event: AuctionEvent;
  campaign: Campaign | null;
  creative: AdCreative | null;
  clickUrl: string;
  brand: string;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  imageUrl: string | null;
  owned: boolean;
  host: string;
  price: number;
};

export function AdSlot({
  publisher,
  slot,
  pageviewId,
  query,
  className,
}: {
  publisher: Publisher;
  slot: Slot;
  pageviewId: string;
  query?: string;
  className?: string;
}) {
  const applyServe = useDesk((s) => s.applyServe);
  const [fill, setFill] = useState<Fill | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("publisher", publisher.id);
    params.set("slot", slot.id);
    params.set("format", slot.format);
    params.set("pageview", pageviewId);
    if (query) params.set("q", query);
    let cancelled = false;
    fetch(`/api/ads/serve?${params.toString()}`)
      .then((r) => r.json())
      .then((data: Fill) => {
        if (cancelled) return;
        setFill(data);
        if (data?.event) applyServe({ event: data.event, campaign: data.campaign });
      })
      .catch(() => {
        if (!cancelled) setFill(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pageviewId, publisher.id, slot.id, slot.format, query, applyServe]);

  if (!fill) {
    return (
      <div className={cn("rounded-md border border-dashed border-border px-3 py-4 text-xs text-subtle", className)}>
        Auctioning this slot…
      </div>
    );
  }

  if (!fill.fill || !fill.creative) {
    return <Remnant className={className} />;
  }

  const creative: AdCreative = fill.creative;
  const campaignStub: Campaign = fill.campaign ?? {
    id: fill.event.campaignId ?? "unknown",
    name: fill.brand,
    brand: fill.brand,
    product: "",
    status: "active",
    objective: "traffic",
    platforms: [fill.event.format],
    dailyBudget: 0,
    cpcBid: 0,
    destination: fill.clickUrl,
    owned: fill.owned,
    aov: 0,
    strategy: "",
    targeting: "",
    creatives: [creative],
    audiences: [],
    stats: [],
    createdAt: fill.event.ts,
  };

  return (
    <ServedAd
      event={fill.event}
      campaign={campaignStub}
      creative={creative}
      href={fill.clickUrl}
      className={className}
      onClick={() => {
        toast.message(`Click billed ${formatMoney(fill.price, 2)} · ${fill.brand}`);
      }}
    />
  );
}

function Remnant({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-md border border-dashed border-border bg-raised/40 px-4 py-5", className)}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Unsold · Multiniche Ads</p>
      <p className="mt-1 text-sm text-muted">This slot had no eligible bidder.</p>
      <Link to="/create" className="mt-2 inline-block text-sm text-fg underline-offset-2 hover:underline">
        Advertise here
      </Link>
    </div>
  );
}

function ServedAd({
  event,
  campaign,
  creative,
  href,
  onClick,
  className,
}: {
  event: AuctionEvent;
  campaign: Campaign;
  creative: AdCreative;
  href: string;
  onClick: () => void;
  className?: string;
}) {
  const format = event.format;
  const inner =
    format === "search" ? (
      <SearchUnit creative={creative} campaign={campaign} />
    ) : format === "social" ? (
      <SocialUnit creative={creative} campaign={campaign} />
    ) : (
      <DisplayUnit creative={creative} campaign={campaign} />
    );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("block text-left transition-opacity duration-150 hover:opacity-95", className)}
      onClick={onClick}
    >
      {inner}
    </a>
  );
}

function SearchUnit({ creative, campaign }: { creative: AdCreative; campaign: Campaign }) {
  const host = campaign.owned ? "multinicheai.com" : campaign.brand.toLowerCase().replace(/\s+/g, "") + ".co";
  return (
    <div className="rounded-lg border border-border bg-bg px-4 py-3">
      <p className="text-[11px] text-subtle">Sponsored · {host}</p>
      <p className="mt-1 font-medium text-fg underline-offset-2">{creative.headline}</p>
      <p className="mt-1 text-sm text-muted">{creative.body}</p>
      <p className="mt-2 text-xs text-subtle">{creative.cta} →</p>
    </div>
  );
}

function SocialUnit({ creative, campaign }: { creative: AdCreative; campaign: Campaign }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-raised ring-1 ring-border" />
          <div>
            <p className="text-xs font-medium">{campaign.brand}</p>
            <p className="text-[10px] text-subtle">Sponsored</p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-subtle">Ads</span>
      </div>
      {creative.imageUrl ? (
        <img src={creative.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/9] items-end poster-wash px-4 py-3">
          <p className="font-display text-xl leading-tight">{creative.headline}</p>
        </div>
      )}
      <div className="px-3 py-3">
        <p className="text-sm font-medium leading-snug">{creative.headline}</p>
        <p className="mt-1 text-sm text-muted">{creative.body}</p>
        <div className="mt-3 flex h-9 items-center justify-center rounded-sm bg-primary text-xs font-medium text-primary-fg">
          {creative.cta}
        </div>
      </div>
    </div>
  );
}

function DisplayUnit({ creative, campaign }: { creative: AdCreative; campaign: Campaign }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg">
      {creative.imageUrl ? (
        <img src={creative.imageUrl} alt="" className="aspect-[3/1] max-h-40 w-full object-cover" />
      ) : (
        <div className="flex min-h-24 items-end poster-wash px-4 py-3">
          <p className="font-display text-lg leading-tight md:text-xl">{creative.headline}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-subtle">{campaign.brand}</p>
          <p className="truncate text-sm font-medium">{creative.subhead || creative.cta}</p>
        </div>
        <span className="shrink-0 rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg">
          {creative.cta}
        </span>
      </div>
    </div>
  );
}
