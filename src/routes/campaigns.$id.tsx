import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ImageIcon, Loader2, Pause, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdPreview } from "@/components/ad-preview";
import { AppShell } from "@/components/app-shell";
import { ExchangeTape } from "@/components/exchange-tape";
import { PerformanceChart } from "@/components/performance-chart";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { generateCreativeImage, optimizeCampaign } from "@/lib/ai";
import {
  formatCompact,
  formatMoney,
  formatPct,
  objectiveLabel,
  platformLabel,
  todayStat,
  winRate,
} from "@/lib/format";
import { useDesk } from "@/lib/store";
import type { Campaign, OptimizeNote } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campaigns/$id")({ component: CampaignPage });

function CampaignPage() {
  const { id } = Route.useParams();
  const campaign = useDesk((s) => s.campaigns.find((c) => c.id === id));

  if (!campaign) {
    return (
      <AppShell title="Missing campaign">
        <p className="text-muted">That book is not on this desk.</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link to="/">
            <ArrowLeft />
            Back to desk
          </Link>
        </Button>
      </AppShell>
    );
  }

  return <CampaignDetail campaign={campaign} />;
}

function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const setStatus = useDesk((s) => s.setStatus);
  const setBid = useDesk((s) => s.setBid);
  const setCreativeImage = useDesk((s) => s.setCreativeImage);
  const tapeAll = useDesk((s) => s.tape);
  const tape = useMemo(
    () =>
      tapeAll.filter(
        (e) => e.campaignId === campaign.id || e.rivals.some((r) => r.campaignId === campaign.id),
      ),
    [tapeAll, campaign.id],
  );
  const [note, setNote] = useState<OptimizeNote | null>(null);
  const [busy, setBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState<string | null>(null);
  const [metric, setMetric] = useState<"spend" | "impressions" | "clicks" | "revenue">("spend");
  const [bidDraft, setBidDraft] = useState(() => campaign.cpcBid.toFixed(2));
  const t = useMemo(() => todayStat(campaign), [campaign]);
  const wins = winRate(tape, campaign.id);

  async function optimize() {
    setBusy(true);
    const snapshot = [
      `${campaign.name} status=${campaign.status} objective=${campaign.objective}`,
      `bid ${campaign.cpcBid} budget/day ${campaign.dailyBudget} spend today ${t.spend}`,
      `impr ${t.impressions} clicks ${t.clicks} conv ${t.conversions} win ${wins}`,
      `strategy: ${campaign.strategy}`,
      `targeting: ${campaign.targeting}`,
      `platforms: ${campaign.platforms.join(",")}`,
    ].join("\n");
    const res = await optimizeCampaign({ data: { snapshot } });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setNote(res.note);
  }

  async function still(creativeId: string) {
    const cr = campaign.creatives.find((c) => c.id === creativeId);
    if (!cr) return;
    setImgBusy(creativeId);
    const res = await generateCreativeImage({
      data: {
        brand: campaign.brand,
        product: campaign.product,
        headline: cr.headline,
        format: cr.format,
      },
    });
    setImgBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCreativeImage(campaign.id, creativeId, res.url);
    toast.success("Still set.");
  }

  function commitBid() {
    const n = Number(bidDraft);
    if (!Number.isFinite(n) || n < 0.05) {
      toast.error("Bid must be at least $0.05.");
      return;
    }
    setBid(campaign.id, n);
    toast.success("Bid updated. Next auction uses it.");
  }

  const canPause = campaign.status === "active";
  const canResume = campaign.status === "paused" || campaign.status === "draft";

  return (
    <AppShell
      eyebrow={campaign.owned ? "House · multinicheai.com" : "Network advertiser"}
      title={campaign.name}
      action={
        <div className="flex gap-2">
          {canPause ? (
            <Button variant="secondary" onClick={() => setStatus(campaign.id, "paused")}>
              <Pause />
              Pause
            </Button>
          ) : null}
          {canResume ? (
            <Button onClick={() => setStatus(campaign.id, "active")}>
              <Play />
              Resume
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={campaign.status} />
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
          {objectiveLabel(campaign.objective)}
        </span>
        {campaign.platforms.map((p) => (
          <span key={p} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {platformLabel(p)}
          </span>
        ))}
        <span className="text-xs text-subtle">{formatMoney(campaign.dailyBudget, 0)} / day</span>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="min-w-40 flex-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Max CPC</p>
          <Input
            type="number"
            step="0.05"
            min="0.05"
            value={bidDraft}
            onChange={(e) => setBidDraft(e.target.value)}
            className="mt-1 max-w-40"
          />
        </div>
        <Button variant="secondary" onClick={commitBid}>
          Set bid
        </Button>
        <p className="text-sm text-muted">
          Win rate {formatPct(wins, 0)} · dest{" "}
          {campaign.owned ? (
            <a href={campaign.destination} className="text-fg underline-offset-2 hover:underline">
              {campaign.destination.replace(/^https?:\/\//, "")}
            </a>
          ) : (
            campaign.brand
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Spend today" value={formatMoney(t.spend, 2)} />
        <Mini label="Impressions" value={formatCompact(t.impressions)} />
        <Mini
          label="CTR / CPC"
          value={`${formatPct(t.impressions ? t.clicks / t.impressions : 0)} · ${formatMoney(t.clicks ? t.spend / t.clicks : 0, 2)}`}
        />
        <Mini
          label={campaign.objective === "leads" ? "CPA" : "ROAS"}
          value={
            campaign.objective === "leads"
              ? t.conversions
                ? formatMoney(t.spend / t.conversions, 2)
                : "—"
              : t.spend
                ? `${(t.revenue / t.spend).toFixed(1)}x`
                : "—"
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl">Live book</h2>
            <div className="flex flex-wrap gap-1">
              {(["spend", "impressions", "clicks", "revenue"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs capitalize",
                    metric === m ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody>
            {campaign.stats.length ? (
              <PerformanceChart stats={campaign.stats} metric={metric} />
            ) : (
              <p className="py-10 text-sm text-muted">
                No fills yet. Open the exchange or visit a publisher this campaign can win.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">Optimize</h2>
              <p className="text-sm text-muted">A performance note, on request.</p>
            </div>
            <Button size="sm" variant="secondary" onClick={optimize} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              {busy ? "Reading" : "Ask"}
            </Button>
          </CardHeader>
          <CardBody className="space-y-3 text-sm text-muted">
            <p>{campaign.strategy}</p>
            {note ? (
              <div className="space-y-3 border-t border-border pt-3">
                <p className="text-fg">{note.summary}</p>
                <ul className="space-y-2">
                  {note.actions.map((a) => (
                    <li key={a.title}>
                      <p className="font-medium text-fg">{a.title}</p>
                      <p>{a.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <h2 className="font-display text-xl">Auctions involving this campaign</h2>
        </CardHeader>
        <CardBody>
          <ExchangeTape tape={tape} empty="Has not entered an auction yet." />
        </CardBody>
      </Card>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-2xl">Creatives</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {campaign.creatives.map((cr) => (
            <Card key={cr.id}>
              <CardBody className="pt-5">
                <AdPreview creative={cr} brand={campaign.brand} />
                {cr.format !== "search" && cr.format !== "video" ? (
                  <Button
                    className="mt-4 w-full"
                    variant="secondary"
                    disabled={imgBusy === cr.id}
                    onClick={() => still(cr.id)}
                  >
                    {imgBusy === cr.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ImageIcon />
                    )}
                    {imgBusy === cr.id ? "Shooting…" : cr.imageUrl ? "Reshoot still" : "Generate still"}
                  </Button>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {campaign.audiences.length ? (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-2xl">Audiences</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {campaign.audiences.map((a) => (
              <Card key={a.id}>
                <CardBody className="pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs tabular-nums text-subtle">{a.size}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{a.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-8">
        <Link to="/" className="text-sm text-muted hover:text-fg">
          ← Back to the exchange
        </Link>
      </p>
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody className="pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">{label}</p>
        <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
      </CardBody>
    </Card>
  );
}
