// Replaces this file's contents. MultiNicheADS's own MCP tools were merged
// into the storefront's server (netlify/functions/mcp.mts on the Jblessd
// repo, commit d6c6d67) as the single canonical source — this file now just
// forwards requests there instead of duplicating the implementation.
import { createFileRoute } from "@tanstack/react-router";

const CANONICAL_MCP_URL = "https://multinicheai.com/api/mcp";

async function proxyToCanonical(request: Request) {
  const body = await request.text();
  const accept = request.headers.get("Accept") ?? "application/json, text/event-stream";

  const upstream = await fetch(CANONICAL_MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: accept },
    body,
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => proxyToCanonical(request),
    },
  },
});
