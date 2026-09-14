import { ImageIcon } from "lucide-react";
import type { AdCreative } from "@/lib/types";
import { STORE } from "@/lib/catalog";
import { platformLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

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

function SearchAd({ creative, brand }: { creative: AdCreative; brand: string }) {
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
    </div>
  );
}

function SocialAd({
  creative,
  brand,
}: {
  creative: AdCreative;
  brand: string;
}) {
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
      </div>
    </div>
  );
}

function DisplayAd({
  creative,
  brand,
}: {
  creative: AdCreative;
  brand: string;
}) {
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
    </div>
  );
}

function VideoAd({ creative, brand }: { creative: AdCreative; brand: string }) {
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
    </div>
  );
}

export function AdPreview({
  creative,
  brand,
  className,
}: {
  creative: AdCreative;
  brand: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-subtle">
        {platformLabel(creative.format)} preview
      </p>
      {creative.format === "search" ? (
        <SearchAd creative={creative} brand={brand} />
      ) : creative.format === "social" ? (
        <SocialAd creative={creative} brand={brand} />
      ) : creative.format === "display" ? (
        <DisplayAd creative={creative} brand={brand} />
      ) : (
        <VideoAd creative={creative} brand={brand} />
      )}
    </div>
  );
}
