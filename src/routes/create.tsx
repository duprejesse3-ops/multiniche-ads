import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AdPreview } from "@/components/ad-preview";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { composeCampaign, type ComposeResult } from "@/lib/ai";
import { CATALOG, STORE } from "@/lib/catalog";
import { proofFromSku } from "@/lib/proof";
import { objectiveLabel, platformLabel } from "@/lib/format";
import { suggestedBid } from "@/lib/auction";
import { useDesk } from "@/lib/store";
import type { AdCreative, Audience, Campaign, Objective, Platform } from "@/lib/types";
import { OBJECTIVES, PLATFORMS } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({ component: CreatePage });

const BUDGETS = [80, 250, 500, 1200, 2500];
const BIDS = [0.8, 1.2, 1.8, 2.5, 3.5];

const DEFAULT = CATALOG[0];

function CreatePage() {
  const navigate = useNavigate();
  const upsert = useDesk((s) => s.upsertCampaign);

  const [skuId, setSkuId] = useState(DEFAULT.id);
  const [brand, setBrand] = useState<string>(STORE.name);
  const [product, setProduct] = useState(DEFAULT.name);
  const [offer, setOffer] = useState(DEFAULT.offer);
  const [notes, setNotes] = useState(`${DEFAULT.blurb} ${DEFAULT.notes}`);
  const [objective, setObjective] = useState<Objective>(DEFAULT.objective);
  const [platforms, setPlatforms] = useState<Platform[]>(DEFAULT.platforms);
  const [dailyBudget, setDailyBudget] = useState(500);
  const [cpcBid, setCpcBid] = useState(() => suggestedBid(DEFAULT.platforms, 500));
  const [destination, setDestination] = useState<string>(STORE.href);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<ComposeResult | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  function togglePlatform(p: Platform) {
    setPlatforms((cur) => {
      if (cur.includes(p)) {
        const next = cur.filter((x) => x !== p);
        return next.length ? next : cur;
      }
      return [...cur, p];
    });
    setDraft(null);
  }

  const liveCreative: AdCreative = useMemo(() => {
    const fromDraft = draft?.creatives[previewIndex] ?? draft?.creatives[0];
    if (fromDraft) {
      return { ...fromDraft, id: "preview" };
    }
    return {
      id: "preview",
      format: platforms[0] ?? "social",
      headline: product || "A line worth buying against.",
      subhead: brand || "Your brand",
      body:
        notes ||
        offer ||
        "Describe the product. The desk will write the campaign — strategy, audiences, and placements.",
      cta: "Learn more",
    };
  }, [draft, previewIndex, platforms, product, brand, notes, offer]);

  async function compose() {
    if (!brand.trim() || !product.trim()) {
      toast.error("Brand and product are required.");
      return;
    }
    setBusy(true);
    const res = await composeCampaign({
      data: {
        brand: brand.trim(),
        product: product.trim(),
        offer: offer.trim(),
        objective,
        platforms,
        dailyBudget,
        notes: notes.trim(),
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDraft(res.draft);
    setPreviewIndex(0);
    toast.success("Draft on the desk.");
  }

  function launch() {
    if (!brand.trim() || !product.trim()) {
      toast.error("Brand and product are required.");
      return;
    }
    const creatives: AdCreative[] = (draft?.creatives ?? [liveCreative]).map((c, i) => ({
      ...c,
      id: `cr_${crypto.randomUUID().slice(0, 8)}_${i}`,
    }));
    const audiences: Audience[] = (draft?.audiences ?? []).map((a, i) => ({
      ...a,
      id: `a_${crypto.randomUUID().slice(0, 8)}_${i}`,
    }));
    const sku = CATALOG.find((s) => s.id === skuId);
    const campaign: Campaign = {
      id: `c_${crypto.randomUUID().slice(0, 8)}`,
      name: draft?.name ?? `${brand} — ${product}`,
      brand: brand.trim(),
      product: product.trim(),
      status: "active",
      objective,
      platforms,
      dailyBudget,
      cpcBid,
      destination: destination.trim() || STORE.href,
      owned: true,
      aov: sku?.price ?? 19,
      proof: sku ? proofFromSku(sku) : undefined,
      strategy: draft?.strategy ?? (notes.trim() || "Launched from a brief; refine in flight."),
      targeting: draft?.targeting ?? "Open prospecting pending first-party signals.",
      creatives,
      audiences,
      stats: [],
      createdAt: new Date().toISOString(),
    };
    upsert(campaign);
    toast.success("Campaign is in flight.");
    void navigate({ to: "/campaigns/$id", params: { id: campaign.id } });
  }

  return (
    <AppShell eyebrow="New campaign" title="Compose">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-xl">Brief</h2>
              <p className="text-sm text-muted">
                Pick a Multiniche SKU. AI writes the book. Launch puts it on the exchange against
                competing advertisers.
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <Label className="mb-2">Catalog · multinicheai.com</Label>
                <div className="flex flex-wrap gap-2">
                  {CATALOG.map((sku) => {
                    const on = skuId === sku.id;
                    return (
                      <button
                        key={sku.id}
                        type="button"
                        onClick={() => {
                          setSkuId(sku.id);
                          setBrand(STORE.name);
                          setProduct(sku.name);
                          setOffer(sku.offer);
                          setNotes(`${sku.blurb} ${sku.notes}`);
                          setObjective(sku.objective);
                          setPlatforms(sku.platforms);
                          setCpcBid(suggestedBid(sku.platforms, dailyBudget));
                          setDestination(STORE.href);
                          setDraft(null);
                        }}
                        className={cn(
                          "h-11 rounded-full border px-3 text-xs sm:text-sm transition-colors duration-150",
                          on
                            ? "border-primary bg-primary text-primary-fg"
                            : "border-border bg-raised text-muted hover:text-fg",
                        )}
                      >
                        {sku.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Brand">
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Multiniche AI" />
              </Field>
              <Field label="Product">
                <Input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Deep Work Prompt Pack"
                />
              </Field>
              <Field label="Offer (optional)">
                <Input
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder="$19 one-time. Watch it run first."
                />
              </Field>
              <div>
                <Label className="mb-2">Objective</Label>
                <div className="grid grid-cols-2 gap-2">
                  {OBJECTIVES.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => {
                        setObjective(o);
                        setDraft(null);
                      }}
                      className={cn(
                        "h-11 rounded-md border text-sm transition-colors duration-150",
                        objective === o
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-border bg-raised text-muted hover:text-fg",
                      )}
                    >
                      {objectiveLabel(o)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2">Placements</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const on = platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={cn(
                          "h-11 rounded-full border px-4 text-sm transition-colors duration-150",
                          on
                            ? "border-primary bg-primary text-primary-fg"
                            : "border-border bg-raised text-muted hover:text-fg",
                        )}
                      >
                        {platformLabel(p)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="mb-2">
                  Daily budget ·{" "}
                  {dailyBudget.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setDailyBudget(b);
                        setCpcBid(suggestedBid(platforms, b));
                      }}
                      className={cn(
                        "h-11 min-w-16 rounded-md border px-3 text-sm tabular-nums",
                        dailyBudget === b
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-border bg-raised text-muted hover:text-fg",
                      )}
                    >
                      ${b}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2">
                  Max CPC · {cpcBid.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {BIDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setCpcBid(b)}
                      className={cn(
                        "h-11 min-w-16 rounded-md border px-3 text-sm tabular-nums",
                        cpcBid === b
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-border bg-raised text-muted hover:text-fg",
                      )}
                    >
                      ${b.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Destination">
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="https://multinicheai.com"
                />
              </Field>
              <Field label="Planner notes">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Who is this for? Spec sheet, not a pitch."
                />
              </Field>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={compose} disabled={busy} className="flex-1">
                  {busy ? <Loader2 className="animate-spin" /> : null}
                  {busy ? "Writing the book…" : "Compose with AI"}
                </Button>
                <Button variant="secondary" onClick={launch} disabled={busy} className="sm:w-40">
                  Launch
                </Button>
              </div>
            </CardBody>
          </Card>

          {draft ? (
            <Card>
              <CardHeader>
                <h2 className="font-display text-xl">{draft.name}</h2>
              </CardHeader>
              <CardBody className="space-y-4 text-sm leading-relaxed text-muted">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-subtle">Strategy</p>
                  <p>{draft.strategy}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-subtle">Targeting</p>
                  <p>{draft.targeting}</p>
                </div>
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-subtle">Audiences</p>
                  <ul className="space-y-2">
                    {draft.audiences.map((a) => (
                      <li key={a.name} className="rounded-md border border-border bg-raised p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-medium text-fg">{a.name}</p>
                          <p className="text-xs tabular-nums text-subtle">{a.size}</p>
                        </div>
                        <p className="mt-1">{a.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          {draft && draft.creatives.length > 1 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {draft.creatives.map((c, i) => (
                <button
                  key={c.format + i}
                  type="button"
                  onClick={() => setPreviewIndex(i)}
                  className={cn(
                    "h-9 rounded-full border px-3 text-xs",
                    i === previewIndex
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-muted",
                  )}
                >
                  {platformLabel(c.format)}
                </button>
              ))}
            </div>
          ) : null}
          {busy ? (
            <Card>
              <CardBody className="pt-5">
                <p className="shimmer-text font-display text-2xl">The desk is writing…</p>
                <p className="mt-3 text-sm text-muted">
                  Strategy, audiences, and a set of ads for {platforms.map(platformLabel).join(", ")}.
                </p>
              </CardBody>
            </Card>
          ) : (
            <AdPreview creative={liveCreative} brand={brand || "Brand"} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
