import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, withCors } from "@/lib/ads-http";
import { bindSpec, clipTask } from "@/lib/proof";
import type { Proof } from "@/lib/types";

function parseProof(raw: unknown): Proof | null {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const sku = String(o.sku ?? "").trim();
  const spec = String(o.spec ?? "").trim();
  const sample = String(o.sample ?? "").trim();
  if (!sku || !spec || !sample) return null;
  return {
    sku,
    spec,
    sample,
    license: String(o.license ?? ""),
    remote: Boolean(o.remote),
  };
}

// Runs a product's proof spec directly, the way ProofRun does on a live
// ad-slot — but against the Compose preview, where there is no AuctionEvent
// (no auction was ever run for this creative) to look a campaign up from.
async function handlePreviewRun(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const proof = parseProof(body.proof);
  if (!proof) {
    return withCors(Response.json({ ok: false, error: "Missing proof" }, { status: 400 }));
  }
  const task = clipTask(body.task);

  let exec: { output: string; live: boolean };
  if (proof.remote) {
    const bound = bindSpec(proof.sample, task);
    const { fetchStorefrontDemo } = await import("@/lib/catalog-remote");
    const scenario = task.excerpt || task.title;
    const result = await fetchStorefrontDemo({ sku: proof.sku, scenario });
    exec = result.ok ? { output: result.output, live: true } : { output: bound, live: false };
  } else {
    const { executeSpec } = await import("@/lib/execute-spec.server");
    exec = await executeSpec({ spec: proof.spec, sample: proof.sample, task, live: true });
  }

  return withCors(
    Response.json({
      ok: true,
      live: exec.live,
      output: exec.output,
      sample: exec.output,
      spec: proof.spec,
      sku: proof.sku,
      license: proof.license,
    }),
  );
}

export const Route = createFileRoute("/api/ads/preview-run")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      POST: async ({ request }) => handlePreviewRun(request),
    },
  },
});
