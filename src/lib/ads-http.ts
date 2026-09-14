export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const proto = (request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")).split(",")[0]!.trim();
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host
  )
    .split(",")[0]!
    .trim();
  return `${proto}://${host}`;
}

export function withCors(res: Response) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(res.body, { status: res.status, headers });
}

export function corsPreflight() {
  return withCors(new Response(null, { status: 204 }));
}

export const PLATFORMS = ["search", "social", "display", "video"] as const;
export type AdFormat = (typeof PLATFORMS)[number];

export function asFormat(v: string | null): AdFormat {
  if (v === "search" || v === "social" || v === "display" || v === "video") return v;
  return "display";
}
