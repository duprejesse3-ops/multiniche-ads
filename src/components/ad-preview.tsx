import { ImageIcon } from "lucide-react";
import { useState } from "react";
import type { AdCreative, PageTask, Proof } from "@/lib/types";
import { STORE } from "@/lib/catalog";
import { platformLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

function PreviewRun({ proof, task }: { proof: Proof; task: PageTask }) {
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ads/preview-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof, task }),
      });
      const data = (await res.json()) as { ok?: boolean; output?: string; live?: boolean };
      if (data?.ok && data.output) {
        setOutput(data.output);
        setLive(Boolean(data.live));
      }
    } catch {
      /* preview stays closed */
    }
    setBusy(false);
  }

  return (
    <div className="mt-3 rounded-md border border-border bg-raised/50 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Spec · run on this page</p>
      {!output ? (
        <button
          type="button"
          onClick={() => void run()}
          className="mt-2 inline-flex h-11 items-center rounded-sm bg-primary px-3 text-xs font-medium text-primary-fg"
        >
          {busy ? "Running on this page…" : "Run it on this page"}
        </button>
      ) : (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">
            {live ? "Ran on this page" : "Bound to this page"}
          </p>
          <p className="text-sm leading-relaxed text-fg whitespace-pre-wrap">{output}</p>
        </div>
      )}
    </div>
  );
}

function Poster({
  brand,
  headline,
  imageUrl,
}: {
  brand: string;
  headline: string;
  imageUrl?: string;
}) {
  if (imageUrl) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-raised">
        <img
          src={imageUrl}
          alt=""
          className="size-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="relative flex aspect-[4/5] w-full flex-col justify-end overflow-hidden rounded-md poster-wash p-5">
      <ImageIcon className="absolute top-4 right-4 size-4 text-subtle" />
      <p className="relative font-display text-2xl leading-tight tracking-tight text-fg">
        {headline}
      </p>
      <p className="relative mt-3 text-[11px] uppercase tracking-[0.18em] text-muted">
        {brand}
      </p>
    </div>
  );
}

type ProofRunProps = { proof?: Proof; task?: PageTask };

function SearchAd({
  creative,
  brand,
  proof,
  task,
}: { creative: AdCreative; brand: string } & ProofRunProps) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <p className="text-[11px] text-subtle">
        Sponsored · {STORE.host}
      </p>
      <p className="mt-1 font-medium text-fg underline-offset-2 hover:underline">
        {creative.headline}
      </p>
      <p className="mt-1 text-sm text-muted">{creative.body}</p>
      <p className="mt-2 text-xs text-subtle">{creative.cta} →</p>
      {proof && task ? <PreviewRun proof={proof} task={task} /> : null}
    </div>
  );
}

function SocialAd({
  creative,
  brand,
  proof,
  task,
}: { creative: AdCreative; brand: string } & ProofRunProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="size-7 rounded-full bg-raised ring-1 ring-border" />
        <div>
          <p className="text-xs font-medium">{brand}</p>
          <p className="text-[10px] text-subtle">Sponsored</p>
        </div>
      </div>
      <div className="px-3 pb-3">
        <Poster brand={brand} headline={creative.headline} imageUrl={creative.imageUrl} />
      </div>
      <div className="border-t border-border px-3 py-3">
        <p className="text-sm font-medium leading-snug">{creative.headline}</p>
        <p className="mt-1 text-sm text-muted">{creative.body}</p>
        <div className="mt-3 flex h-9 items-center justify-center rounded-sm bg-primary text-xs font-medium text-primary-fg">
          {creative.cta}
        </div>
        {proof && task ? <PreviewRun proof={proof} task={task} /> : null}
      </div>
    </div>
  );
}

function DisplayAd({
  creative,
  brand,
  proof,
  task,
}: { creative: AdCreative; brand: string } & ProofRunProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg">
      {creative.imageUrl ? (
        <img src={creative.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/9] items-end bg-raised p-4">
          <p className="font-display text-xl leading-tight">{creative.headline}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 p-3">
        <div>
          <p className="text-xs text-subtle">{brand}</p>
          <p className="text-sm font-medium">{creative.subhead || creative.cta}</p>
        </div>
        <span className="rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg">
          {creative.cta}
        </span>
      </div>
      {proof && task ? (
        <div className="px-3 pb-3">
          <PreviewRun proof={proof} task={task} />
        </div>
      ) : null}
    </div>
  );
}

function VideoAd({
  creative,
  brand,
  proof,
  task,
}: { creative: AdCreative; brand: string } & ProofRunProps) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-subtle">
        <span>{brand}</span>
        <span>{creative.subhead || "0:15"}</span>
      </div>
      <p className="font-display text-xl leading-tight">{creative.headline}</p>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted">
        {creative.body}
      </pre>
      <p className="mt-3 text-xs text-subtle">End card · {creative.cta}</p>
      {proof && task ? <PreviewRun proof={proof} task={task} /> : null}
    </div>
  );
}

export function AdPreview({
  creative,
  brand,
  proof,
  task,
  className,
}: {
  creative: AdCreative;
  brand: string;
  className?: string;
} & ProofRunProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-subtle">
        {platformLabel(creative.format)} preview
      </p>
      {creative.format === "search" ? (
        <SearchAd creative={creative} brand={brand} proof={proof} task={task} />
      ) : creative.format === "social" ? (
        <SocialAd creative={creative} brand={brand} proof={proof} task={task} />
      ) : creative.format === "display" ? (
        <DisplayAd creative={creative} brand={brand} proof={proof} task={task} />
      ) : (
        <VideoAd creative={creative} brand={brand} proof={proof} task={task} />
      )}
    </div>
  );
}
