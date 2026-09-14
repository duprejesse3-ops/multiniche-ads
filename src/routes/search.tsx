import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { NetworkBar } from "@/components/network-bar";
import { Input } from "@/components/ui/input";
import { publisherBySlug, TRENDING_QUERIES } from "@/lib/network";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
  }),
  component: FindrPage,
});

const ORGANIC: { title: string; host: string; snippet: string; terms: string }[] = [
  {
    title: "A ninety-minute block that actually holds",
    host: "deepworkdigest.com",
    snippet: "Write the rule down. The people who interrupt you cannot argue with a document they have not seen.",
    terms: "deep work focus block morning founder productivity prompts",
  },
  {
    title: "Make.com inbox triage — exception queue",
    host: "operatorweekly.com",
    snippet: "Draft the 58. Open the 12. Human attention is the scarce SKU.",
    terms: "inbox automation make.com email triage sales cs zapier",
  },
  {
    title: "Review latency is a product metric",
    host: "shiplog.dev",
    snippet: "A daily digest with risk flags would have made the stall visible. Slack did not.",
    terms: "github pr digest code review engineering",
  },
  {
    title: "Notes in, posts queued",
    host: "desknotes.co",
    snippet: "A calendar that does not draft is a spreadsheet with anxiety. Voice lock belongs in the pipe.",
    terms: "content calendar zapier marketing writers landing page copy",
  },
  {
    title: "Stop pasting the company into chat",
    host: "northbound.example",
    snippet: "Investor updates and pricing notes need a desk, not another chatbot tab.",
    terms: "claude agent founders operators",
  },
];

function FindrPage() {
  const { q: qParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [draft, setDraft] = useState(qParam);
  const publisher = publisherBySlug("findr")!;
  const [pageviewId, setPageviewId] = useState(() => crypto.randomUUID());
  const slot = publisher.slots[0]!;
  const q = qParam.trim();

  const organic = useMemo(() => {
    if (!q) return ORGANIC;
    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return [...ORGANIC].sort((a, b) => score(b.terms, words) - score(a.terms, words));
  }, [q]);

  function submit(next: string) {
    const query = next.trim();
    setPageviewId(crypto.randomUUID());
    void navigate({ to: "/search", search: { q: query } });
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <NetworkBar property="findr.net" />
      <main className="mx-auto max-w-2xl px-4 py-10 pb-24">
        <p className="font-display text-3xl tracking-tight">Findr</p>
        <form
          className="relative mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search the network"
            className="pl-10"
            aria-label="Search"
          />
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRENDING_QUERIES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setDraft(t);
                submit(t);
              }}
              className={cn(
                "h-9 rounded-full border px-3 text-xs",
                q === t
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border text-muted hover:text-fg",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {q ? (
          <p className="mt-8 text-xs text-subtle">
            Results for “{q}” · sponsored slots auction on this query
          </p>
        ) : (
          <p className="mt-8 text-xs text-subtle">Type a query to run a search auction.</p>
        )}

        <div className="mt-4">
          <AdSlot
            key={pageviewId}
            publisher={publisher}
            slot={slot}
            pageviewId={pageviewId}
            query={q || "ai tools"}
          />
        </div>

        <ul className="mt-8 space-y-6">
          {organic.map((r) => (
            <li key={r.title}>
              <p className="text-xs text-subtle">{r.host}</p>
              <p className="font-medium text-fg">{r.title}</p>
              <p className="mt-1 text-sm text-muted">{r.snippet}</p>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-sm text-subtle">
          <Link to="/inventory" className="hover:text-fg">
            All publishers
          </Link>
        </p>
      </main>
    </div>
  );
}

function score(terms: string, words: string[]) {
  if (!words.length) return 0;
  return words.filter((w) => terms.includes(w)).length;
}
