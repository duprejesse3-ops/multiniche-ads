import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdPreview } from "@/components/ad-preview";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { composeVariants } from "@/lib/ai";
import { CATALOG, STORE } from "@/lib/catalog";
import { fetchStorefrontCatalog, type StorefrontProduct } from "@/lib/catalog-remote";
import { platformLabel } from "@/lib/format";
import { useDesk } from "@/lib/store";
import type { AdCreative, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({ component: StudioPage });

const TONES = ["restrained", "wry", "urgent", "warm"] as const;

function StudioPage() {
  const save = useDesk((s) => s.saveToLibrary);
  const library = useDesk((s) => s.library);
  const campaigns = useDesk((s) => s.campaigns);
  const attach = useDesk((s) => s.attachCreative);

  const [brand, setBrand] = useState<string>(STORE.name);
  const [product, setProduct] = useState(CATALOG[0].name);
  const [notes, setNotes] = useState(
    "Spec sheet, not a pitch. Run it on the page they are reading. One-time. Claude, ChatGPT, Gemini.",
  );
  const [format, setFormat] = useState<Platform>("social");
  const [tone, setTone] = useState<(typeof TONES)[number]>("restrained");
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<AdCreative[]>([]);
  const [attachId, setAttachId] = useState(campaigns[0]?.id ?? "");
  const [storefront, setStorefront] = useState<StorefrontProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchStorefrontCatalog().then((products) => {
      if (!cancelled) setStorefront(products);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const allProducts = [
    ...CATALOG.map((s) => ({ id: s.id, name: s.name, price: s.price, notes: `${s.blurb} ${s.notes}` })),
    ...storefront
      .filter((p) => !CATALOG.some((s) => s.id === p.sku))
      .map((p) => ({ id: p.sku, name: p.name, price: p.price, notes: p.blurb })),
  ];

  async function generate() {
    if (!brand.trim() || !product.trim()) {
      toast.error("Brand and product are required.");
      return;
    }
    setBusy(true);
    const res = await composeVariants({
      data: {
        brand: brand.trim(),
        product: product.trim(),
        format,
        tone,
        notes: notes.trim(),
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setVariants(
      res.variants.map((v, i) => ({
        ...v,
        id: `lib_${crypto.randomUUID().slice(0, 8)}_${i}`,
      })),
    );
  }

  function onSave(c: AdCreative) {
    save({
      ...c,
      brand: brand.trim(),
      product: product.trim(),
      savedAt: new Date().toISOString(),
    });
    toast.success("Saved to the library.");
  }

  function onAttach(c: AdCreative) {
    if (!attachId) {
      toast.error("Pick a campaign.");
      return;
    }
    attach(attachId, { ...c, id: `cr_${crypto.randomUUID().slice(0, 8)}` });
    toast.success("Attached to campaign.");
  }

  return (
    <AppShell eyebrow="Copy & stills" title="Studio">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <h2 className="font-display text-xl">Set type</h2>
            <p className="text-sm text-muted">
              Three angles for a Multiniche SKU. Spec sheet, not a pitch.
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Product</Label>
              <select
                className="h-11 w-full rounded-md border border-border bg-raised px-3 text-sm text-fg"
                value={allProducts.find((s) => s.name === product)?.id ?? allProducts[0]?.id ?? ""}
                onChange={(e) => {
                  const sku = allProducts.find((s) => s.id === e.target.value);
                  if (!sku) return;
                  setProduct(sku.name);
                  setNotes(sku.notes);
                }}
              >
                {allProducts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · ${s.price}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2">Placement</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormat(p)}
                    className={cn(
                      "h-11 rounded-full border px-4 text-sm",
                      format === p
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-raised text-muted hover:text-fg",
                    )}
                  >
                    {platformLabel(p)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2">Tone</Label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={cn(
                      "h-11 rounded-full border px-4 text-sm capitalize",
                      tone === t
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-raised text-muted hover:text-fg",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Spec sheet, not a pitch. Mention try-before-pay."
              />
            </div>
            <Button onClick={generate} disabled={busy} className="w-full">
              {busy ? <Loader2 className="animate-spin" /> : null}
              {busy ? "Setting type…" : "Write variants"}
            </Button>
          </CardBody>
        </Card>

        <div className="space-y-4">
          {busy ? (
            <Card>
              <CardBody className="pt-6">
                <p className="shimmer-text font-display text-2xl">Setting type…</p>
              </CardBody>
            </Card>
          ) : variants.length === 0 ? (
            <Card>
              <CardBody className="pt-6">
                <p className="font-display text-2xl">Nothing on the board yet.</p>
                <p className="mt-2 text-sm text-muted">
                  Write a set of {platformLabel(format).toLowerCase()} ads, then save or attach them to a campaign in flight.
                </p>
              </CardBody>
            </Card>
          ) : (
            variants.map((v) => (
              <Card key={v.id}>
                <CardBody className="pt-5">
                  <AdPreview creative={v} brand={brand} />
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button variant="secondary" size="sm" onClick={() => onSave(v)}>
                      <Bookmark />
                      Save
                    </Button>
                    <select
                      className="h-11 flex-1 rounded-md border border-border bg-raised px-3 text-sm text-fg"
                      value={attachId}
                      onChange={(e) => setAttachId(e.target.value)}
                    >
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" onClick={() => onAttach(v)}>
                      Attach
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>

      {library.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl">Library</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {library.map((item) => (
              <Card key={item.id}>
                <CardBody className="pt-5">
                  <p className="mb-3 text-xs text-subtle">
                    {item.brand} · {platformLabel(item.format)}
                  </p>
                  <AdPreview creative={item} brand={item.brand} />
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
