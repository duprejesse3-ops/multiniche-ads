// Bridges MultiNicheADS to the real storefront catalog at multinicheai.com,
// so a campaign can exist — and actually run — for any of the real products,
// not only the 9 hand-curated flagships in ./catalog.ts.
//
// Two things live here:
//   - fetchStorefrontCatalog(): the full live catalog, for the Compose picker
//     and for name-matching a campaign to a real SKU.
//   - fetchStorefrontDemo(): delegates an actual run to the storefront's own
//     Live Proof engine (/api/demo) for a SKU, rather than duplicating its
//     prompt-writing logic here. That engine already has a real, tested
//     prompt per product; hand-writing a second copy for 65 more SKUs would
//     just be a second thing to keep in sync with the first forever.

const STOREFRONT_ORIGIN = "https://multinicheai.com";

export type StorefrontProduct = {
  sku: string;
  name: string;
  category: string;
  niche: string;
  format: string;
  price: number;
  blurb: string;
  catLabel?: string;
  nicheLabel?: string;
};

let cache: { at: number; products: StorefrontProduct[] } | null = null;
const CACHE_MS = 5 * 60 * 1000; // matches the storefront's own catalog cache window

export async function fetchStorefrontCatalog(): Promise<StorefrontProduct[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.products;
  try {
    const res = await fetch(`${STOREFRONT_ORIGIN}/api/products`);
    if (!res.ok) return cache?.products ?? [];
    const data = (await res.json()) as { products?: StorefrontProduct[] };
    const products = Array.isArray(data.products) ? data.products : [];
    if (products.length) cache = { at: Date.now(), products };
    return products;
  } catch {
    // Network unreachable, or multinicheai.com is down — serve the last good
    // copy if there is one rather than failing every lookup outright.
    return cache?.products ?? [];
  }
}

export function findStorefrontProductByName(
  products: StorefrontProduct[],
  hay: string,
): StorefrontProduct | undefined {
  const needle = hay.toLowerCase();
  return products.find((p) => needle.includes(p.name.toLowerCase()));
}

export async function fetchStorefrontDemo(opts: {
  sku: string;
  scenario: string;
}): Promise<{ ok: true; output: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${STOREFRONT_ORIGIN}/api/demo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sku: opts.sku, scenario: opts.scenario.slice(0, 600) }),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `storefront demo failed (${res.status}): ${text.slice(0, 300)}` };
    return { ok: true, output: text };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "storefront demo unreachable" };
  }
}
