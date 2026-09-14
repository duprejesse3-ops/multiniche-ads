import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/format";
import type { Publisher, Slot } from "@/lib/network";
import { useDesk } from "@/lib/store";
import type { AdCreative, AuctionEvent, Campaign, Proof } from "@/lib/types";
import { cn } from "@/lib/utils";

type Fill = {
  fill: boolean;
  event: AuctionEvent;
  campaign: Campaign | null;
  creative: AdCreative | null;
  clickUrl: string;
  runUrl: string;
  proof: Proof | null;
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
    proof: fill.proof ?? undefined,
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
      runUrl={fill.runUrl}
      proof={fill.proof ?? campaignStub.proof ?? null}
      className={className}
      onClick={() => {
        toast.message(`Click billed ${formatMoney(fill.price, 2)} · ${fill.brand}`);
      }}
      onRan={(patch) => {
        applyServe(patch);
        toast.message("Spec ran on this page.");
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
  runUrl,
  proof,
  onClick,
  onRan,
  className,
}: {
  event: AuctionEvent;
  campaign: Campaign;
  creative: AdCreative;
  href: string;
  runUrl: string;
  proof: Proof | null;
  onClick: () => void;
  onRan: (patch: { event: AuctionEvent; campaign: Campaign | null }) => void;
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
    <div className={cn("text-left", className)}>
      {inner}
      {proof ? <ProofRun proof={proof} runUrl={runUrl} eventId={event.id} onRan={onRan} /> : null}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex h-11 items-center text-sm text-fg underline-offset-2 hover:underline"
        onClick={onClick}
      >
        {creative.cta} →
      </a>
    </div>
  );
}

function pageTask() {
  if (typeof document === "undefined") return { title: "", url: "", excerpt: "" };
  const node = document.querySelector("article") ?? document.querySelector("main") ?? document.body;
  const excerpt = (node?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 700);
  return {
    title: document.title.slice(0, 160),
    url: location.href.slice(0, 400),
    excerpt,
  };
}

function ProofRun({
  proof,
  runUrl,
  eventId,
  onRan,
}: {
  proof: Proof;
  runUrl: string;
  eventId: string;
  onRan: (patch: { event: AuctionEvent; campaign: Campaign | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [kept, setKept] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(runUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e: eventId, ...pageTask() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        output?: string;
        sample?: string;
        live?: boolean;
        event?: AuctionEvent;
        campaign?: Campaign | null;
      };
      const text = data.output || data.sample;
      if (!data?.ok || !text) {
        setBusy(false);
        return;
      }
      setOutput(text);
      setLive(Boolean(data.live));
      setOpen(true);
      if (data.event) onRan({ event: data.event, campaign: data.campaign ?? null });
    } catch {
      /* remnant stays closed */
    }
    setBusy(false);
  }

  return (
    <div className="mt-3 rounded-md border border-border bg-raised/50 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Spec · run on this page</p>
      {!open ? (
        <button
          type="button"
          onClick={() => void run()}
          className="mt-2 inline-flex h-11 items-center rounded-sm bg-primary px-3 text-xs font-medium text-primary-fg"
        >
          {busy ? "Running on this page…" : "Run it on this page"}
        </button>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">
            {live ? "Ran on this page" : "Bound to this page"}
          </p>
          <p className="text-sm leading-relaxed text-fg whitespace-pre-wrap">{output}</p>
          <button
            type="button"
            className="inline-flex h-11 items-center text-xs text-fg underline-offset-2 hover:underline"
            onClick={() => {
              void navigator.clipboard.writeText(proof.spec);
              setKept(true);
            }}
          >
            {kept ? "Spec copied" : "Keep this spec"}
          </button>
          <p className="font-mono text-[11px] leading-relaxed text-muted">{proof.spec}</p>
          <p className="text-[11px] text-subtle">{proof.license}</p>
        </div>
      )}
    </div>
  );
}

function SearchUnit({ creative, campaign }: { creative: AdCreative; campaign: Campaign }) {
  const host = campaign.owned ? "multinicheai.com" : campaign.brand.toLowerCase().replace(/\s+/g, "") + ".co";
  return (
    <div className="rounded-lg border border-border bg-bg px-4 py-3">
      <p className="text-[11px] text-subtle">Sponsored · {host}</p>
      <p className="mt-1 font-medium text-fg">{creative.headline}</p>
      <p className="mt-1 text-sm text-muted">{creative.body}</p>
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
            <p className="text-[10px] text-subtle">Sponsored spec</p>
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
      <div className="px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-subtle">{campaign.brand}</p>
        <p className="truncate text-sm font-medium">{creative.subhead || creative.headline}</p>
      </div>
    </div>
  );
}
