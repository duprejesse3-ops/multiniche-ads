import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/web")({ component: OpenWebPage });

function OpenWebPage() {
  useEffect(() => {
    const existing = document.querySelector("script[data-mn-tag]");
    if (existing) {
      existing.remove();
    }
    const script = document.createElement("script");
    script.src = "/tag.js?v=3";
    script.async = true;
    script.dataset.mnTag = "1";
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-dvh bg-[#f6f3ec] text-[#1a1916]">
      <div className="border-b border-[#e6e1d6] bg-[#fffdf8] text-xs text-[#6b6560]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <p>
            Third-party page · loads <span className="text-[#1a1916]">/tag.js</span> like
            multinicheai.com would
          </p>
          <Link to="/" className="text-[#1a1916] underline-offset-2 hover:underline">
            Back to exchange
          </Link>
        </div>
      </div>

      <header className="border-b border-[#e6e1d6] bg-[#fffdf8]">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#6b6560]">
            Operator Field Notes
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight">The morning block is a spec</h1>
          <p className="mt-3 max-w-xl text-[#4a4640]">
            A standalone page. No app chrome. The units below are filled by the Multiniche tag —
            the same snippet you paste on the store.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-24">
        <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#6b6560]">Advertisement</p>
        <div
          data-mn-ad
          data-site="operatorfield.notes"
          data-slot="s_web_display"
          data-format="display"
          data-tags="founders,productivity,chatgpt,ops"
        />

        <article className="mt-10 space-y-5 text-base leading-relaxed text-[#1a1916]">
          <p>
            Most founders do not have a focus problem. They have a calendar that treats deep work as
            leftover. Write the rule down. Give the assistant the spec, not a vibe.
          </p>
          <p>
            This page is what the open web looks like to the exchange: a host, a slot, a few tags.
            The auction does not know it is a demo. Pause a campaign on the desk, refresh this
            page, and watch the fill change.
          </p>
        </article>

        <p className="mb-2 mt-10 text-[10px] uppercase tracking-[0.16em] text-[#6b6560]">
          Advertisement
        </p>
        <div
          data-mn-ad
          data-site="operatorfield.notes"
          data-slot="s_web_infeed"
          data-format="social"
          data-tags="founders,productivity,chatgpt,ops"
        />

        <p className="mt-12 text-sm text-[#6b6560]">
          House clicks land on multinicheai.com. The click is billed on the exchange first.
        </p>
      </main>
    </div>
  );
}
