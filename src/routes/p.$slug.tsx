import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { NetworkBar } from "@/components/network-bar";
import { publisherBySlug } from "@/lib/network";

export const Route = createFileRoute("/p/$slug")({ component: PublisherPage });

function PublisherPage() {
  const { slug } = Route.useParams();
  const publisher = publisherBySlug(slug);
  const [pageviewId] = useState(() => crypto.randomUUID());

  const lead = publisher?.slots.find((s) => s.placement === "leaderboard");
  const feed = publisher?.slots.find((s) => s.placement === "infeed");
  const rail = publisher?.slots.find((s) => s.placement === "rail" || s.placement === "sponsored");

  const article = publisher?.articles[0];
  const extra = publisher?.articles[1];

  const body = useMemo(() => article?.body ?? [], [article]);

  if (!publisher) {
    return (
      <div className="min-h-dvh bg-bg text-fg">
        <NetworkBar property="Unknown property" />
        <main className="mx-auto max-w-xl px-4 py-16">
          <h1 className="font-display text-3xl">No such publisher</h1>
          <Link to="/inventory" className="mt-4 inline-block text-sm text-muted hover:text-fg">
            ← Inventory
          </Link>
        </main>
      </div>
    );
  }

  if (publisher.slug === "findr") {
    return (
      <div className="min-h-dvh bg-bg text-fg">
        <NetworkBar property={publisher.domain} />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">{publisher.domain}</p>
          <h1 className="mt-2 font-display text-4xl">Findr</h1>
          <p className="mt-3 text-muted">Search ads auction against the query.</p>
          <Link
            to="/search"
            search={{ q: "" }}
            className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-fg"
          >
            Open Findr
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <NetworkBar property={publisher.domain} />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-baseline justify-between gap-4 px-4 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">{publisher.kicker}</p>
            <p className="font-display text-2xl tracking-tight md:text-3xl">{publisher.name}</p>
          </div>
          <p className="hidden text-xs text-subtle sm:block">{publisher.domain}</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 pb-24">
        {lead ? (
          <div className="mb-8">
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-subtle">Advertisement</p>
            <AdSlot publisher={publisher} slot={lead} pageviewId={pageviewId} />
          </div>
        ) : null}

        {article ? (
          <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div>
              <h1 className="font-display text-3xl leading-tight tracking-tight md:text-4xl">
                {article.title}
              </h1>
              <p className="mt-3 text-lg text-muted">{article.dek}</p>
              <p className="mt-2 text-xs text-subtle">{article.byline}</p>
              <div className="mt-8 space-y-5 text-base leading-relaxed text-fg/90">
                {body.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>

              {feed ? (
                <div className="my-10">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-subtle">
                    Advertisement
                  </p>
                  <AdSlot publisher={publisher} slot={feed} pageviewId={pageviewId} />
                </div>
              ) : null}

              {extra ? (
                <section className="mt-10 border-t border-border pt-8">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Up next</p>
                  <h2 className="mt-2 font-display text-2xl">{extra.title}</h2>
                  <p className="mt-2 text-muted">{extra.dek}</p>
                  {extra.body[0] ? <p className="mt-4 leading-relaxed">{extra.body[0]}</p> : null}
                </section>
              ) : null}
            </div>

            <aside className="space-y-4 lg:pt-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">On this desk</p>
              <p className="text-sm leading-relaxed text-muted">{publisher.blurb}</p>
              {rail ? (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-subtle">
                    Advertisement
                  </p>
                  <AdSlot publisher={publisher} slot={rail} pageviewId={pageviewId} />
                </div>
              ) : null}
              <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                <p className="text-xs text-subtle">Tags</p>
                <p className="mt-1">{publisher.tags.join(" · ")}</p>
              </div>
            </aside>
          </article>
        ) : null}
      </main>
    </div>
  );
}
