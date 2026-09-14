import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { expandAudience } from "@/lib/ai";
import { useDesk } from "@/lib/store";
import type { Audience } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/audiences")({ component: AudiencesPage });

type Row = Audience & { campaignId: string; campaignName: string; product: string };

function AudiencesPage() {
  const campaigns = useDesk((s) => s.campaigns);
  const addAudiences = useDesk((s) => s.addAudiences);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lookalikes, setLookalikes] = useState<Audience[] | null>(null);

  const rows: Row[] = useMemo(
    () =>
      campaigns.flatMap((c) =>
        c.audiences.map((a) => ({
          ...a,
          campaignId: c.id,
          campaignName: c.name,
          product: c.product,
        })),
      ),
    [campaigns],
  );

  const current = rows.find((r) => r.id === selected) ?? rows[0];

  async function expand() {
    if (!current) return;
    setBusy(true);
    setLookalikes(null);
    const res = await expandAudience({
      data: {
        name: current.name,
        description: current.description,
        product: current.product,
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setLookalikes(
      res.audiences.map((a, i) => ({
        ...a,
        id: `a_${crypto.randomUUID().slice(0, 8)}_${i}`,
      })),
    );
  }

  function attachAll() {
    if (!current || !lookalikes?.length) return;
    addAudiences(current.campaignId, lookalikes);
    toast.success("Segments added to the campaign.");
    setLookalikes(null);
  }

  return (
    <AppShell eyebrow="Who we buy" title="Audiences">
      {rows.length === 0 ? (
        <Card>
          <CardBody className="pt-6">
            <p className="font-display text-2xl">No segments on the desk.</p>
            <p className="mt-2 text-sm text-muted">Compose a campaign to generate buyable audiences.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ul className="space-y-2">
            {rows.map((r) => {
              const on = (selected ?? rows[0]?.id) === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(r.id);
                      setLookalikes(null);
                    }}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-colors duration-150",
                      on ? "border-primary/40 bg-surface" : "border-border bg-bg hover:bg-surface",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs tabular-nums text-subtle">{r.size}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">{r.description}</p>
                    <p className="mt-2 text-[11px] text-subtle">{r.campaignName}</p>
                  </button>
                </li>
              );
            })}
          </ul>

          {current ? (
            <div className="space-y-4">
              <Card>
                <CardBody className="pt-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Affinity</p>
                  <p className="mt-1 font-display text-4xl tabular-nums">{current.affinity}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${current.affinity}%` }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {current.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <Button className="mt-5 w-full" onClick={expand} disabled={busy}>
                    {busy ? <Loader2 className="animate-spin" /> : null}
                    {busy ? "Finding neighbors…" : "Expand this segment"}
                  </Button>
                </CardBody>
              </Card>

              {lookalikes ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl">Adjacent</h3>
                    <Button size="sm" variant="secondary" onClick={attachAll}>
                      Add all
                    </Button>
                  </div>
                  {lookalikes.map((a) => (
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
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
