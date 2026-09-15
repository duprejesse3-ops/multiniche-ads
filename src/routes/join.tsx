import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/join")({ component: JoinPage });

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0c0d0f" />
      <rect x="5" y="5" width="9" height="9" rx="1.6" fill="#efece4" />
      <rect x="18" y="5" width="9" height="9" rx="1.6" fill="#FFB020" />
      <rect x="5" y="18" width="9" height="9" rx="1.6" fill="#efece4" opacity="0.38" />
      <rect x="18" y="18" width="9" height="9" rx="1.6" fill="#efece4" />
    </svg>
  );
}

function CopyBlock({ text }: { text: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border border-border bg-raised p-4 text-xs leading-relaxed text-muted">
        {text}
      </pre>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(text);
          toast.success("Copied.");
        }}
        className="absolute right-3 top-3 rounded-md border border-border bg-bg px-2.5 py-1 text-[11px] text-fg hover:bg-raised"
      >
        Copy
      </button>
    </div>
  );
}

function JoinPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const tag = useMemo(() => {
    const src = origin || "https://this-exchange.grok.me";
    return `<div
  data-mn-ad
  data-site="your-site.com"
  data-slot="s_your_slot"
  data-format="display"
  data-tags="your,niche,tags,here">
</div>
<script async src="${src}/tag.js"></script>`;
  }, [origin]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-2.5">
            <Mark className="size-6" />
            <span className="font-display text-lg tracking-tight">MultiNicheADS</span>
          </div>
          <Link to="/" className="text-xs text-subtle underline-offset-2 hover:underline">
            Open the exchange
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
          A reciprocal ad exchange
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Trade one ad slot.
          <br />
          Get real ones back.
        </h1>
        <p className="mt-5 max-w-xl text-muted">
          Paste one script tag on your site. It shows a real, working spec from the exchange —
          not a banner, an actual job the visitor can run. In exchange, your own product can show
          on every other site in the network. No fee, no signup form, no money changes hands. You
          can pull the tag any time.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-raised p-4">
            <p className="font-display text-sm text-fg">1. Paste the tag</p>
            <p className="mt-1.5 text-xs leading-relaxed text-subtle">
              One script, one div. Your slot goes live on first pageview — nothing to register
              first.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-raised p-4">
            <p className="font-display text-sm text-fg">2. Add your own spec</p>
            <p className="mt-1.5 text-xs leading-relaxed text-subtle">
              Tell us what you sell or ship. That's what runs in other tenants' slots — including
              ours.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-raised p-4">
            <p className="font-display text-sm text-fg">3. Watch the tape</p>
            <p className="mt-1.5 text-xs leading-relaxed text-subtle">
              Every fill, click, and run on the network is visible — yours and everyone else's.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <p className="font-display text-lg">The tag</p>
          <p className="mt-1 text-sm text-muted">
            Swap <code className="text-fg">data-site</code> for your domain and{" "}
            <code className="text-fg">data-tags</code> for whatever describes your audience.
          </p>
          <div className="mt-3">
            <CopyBlock text={tag} />
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="font-display text-lg">Why this instead of Google or Meta</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Display ads sell attention that might convert. This sells a completed job — the
            spec actually runs, on the page, before anyone pays for anything. Agents can auction
            here too: an AI browsing the page can discover the offer and POST its own task
            straight to it, no human in the loop. That's not something an exchange bolted onto
            display inventory can do.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <a
            href="mailto:hello@multinicheai.com?subject=Joining the exchange"
            className="rounded-md bg-fg px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90"
          >
            Tell us what you're adding
          </a>
          <Link
            to="/web"
            className="rounded-md border border-border px-4 py-2.5 text-sm text-fg hover:bg-raised"
          >
            See the tag running on a page
          </Link>
        </div>
      </main>
    </div>
  );
}
