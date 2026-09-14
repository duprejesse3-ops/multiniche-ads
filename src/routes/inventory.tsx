import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/format";
import { PUBLISHERS } from "@/lib/network";
import { useDesk } from "@/lib/store";

export const Route = createFileRoute("/inventory")({ component: InventoryPage });

function InventoryPage() {
  const tape = useDesk((s) => s.tape);
  const sites = useDesk((s) => s.sites);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippet = useMemo(() => {
    const src = origin || "https://your-exchange.example";
    return `<div
  data-mn-ad
  data-site="multinicheai.com"
  data-slot="s_web_display"
  data-format="display"
  data-tags="founders,productivity,chatgpt,ops,marketing">
</div>
<script async src="${src}/tag.js?v=3"></script>`;
  }, [origin]);

  return (
    <AppShell eyebrow="Supply" title="Inventory">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        First-party properties run in this app. The tag below is the open-web contract — paste it on{" "}
        <a href="https://multinicheai.com" className="text-fg underline-offset-2 hover:underline">
          multinicheai.com
        </a>{" "}
        or any other page. Each pageview auctions against the live book on this server. Clicks
        bill, then send the visitor to the destination.
      </p>

      <Card className="mb-8">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Open-web tag</h2>
            <p className="text-sm text-muted">
              Same auction as Findr and the Digest. After you publish, this origin is the ad server.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(snippet);
                toast.success("Tag copied.");
              }}
            >
              Copy tag
            </Button>
            <Button size="sm" asChild>
              <Link to="/web">Open a third-party page</Link>
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <pre className="overflow-x-auto rounded-md border border-border bg-raised p-4 text-xs leading-relaxed text-muted">
            {snippet}
          </pre>
          <p className="mt-3 text-xs leading-relaxed text-subtle">
            <code className="text-muted">data-site</code> is the host.{" "}
            <code className="text-muted">data-format</code> is display, social, or search.{" "}
            <code className="text-muted">data-tags</code> steers quality. Add as many{" "}
            <code className="text-muted">data-mn-ad</code> nodes as you have slots; one script.
          </p>
        </CardBody>
      </Card>

      {sites.length ? (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-2xl">Live open-web sites</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <ul>
              {sites.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{s.domain}</p>
                    <p className="text-xs text-subtle">{s.tags.join(" · ")}</p>
                  </div>
                  <p className="text-xs tabular-nums text-muted">
                    {formatNumber(s.hits)} fills · last{" "}
                    {String(s.lastSeen ?? "")
                      .slice(0, 16)
                      .replace("T", " ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <h2 className="mb-3 font-display text-2xl">First-party properties</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {PUBLISHERS.map((p) => {
          const fills = tape.filter((e) => e.publisherId === p.id);
          const won = fills.filter((e) => e.outcome === "won");
          const spend = won.reduce((a, e) => a + (e.clicked ? e.price : 0), 0);
          return (
            <Card key={p.id}>
              <CardBody className="pt-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">{p.kicker}</p>
                <h3 className="mt-1 font-display text-2xl">{p.name}</h3>
                <p className="text-xs text-subtle">{p.domain}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-subtle">
                  <span>Floor {formatMoney(p.floorCpc, 2)} CPC</span>
                  <span>{formatNumber(won.length)} fills</span>
                  <span>{formatMoney(spend, 2)} billed</span>
                </div>
                {p.slug === "findr" ? (
                  <Link
                    to="/search"
                    search={{ q: "" }}
                    className="mt-5 inline-flex h-11 items-center text-sm text-fg underline-offset-2 hover:underline"
                  >
                    Open Findr →
                  </Link>
                ) : (
                  <Link
                    to="/p/$slug"
                    params={{ slug: p.slug }}
                    className="mt-5 inline-flex h-11 items-center text-sm text-fg underline-offset-2 hover:underline"
                  >
                    Open site →
                  </Link>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
