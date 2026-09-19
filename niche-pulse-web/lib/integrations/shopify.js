async function shopifyRequest(shopDomain, accessToken, path) {
  const res = await fetch(`https://${shopDomain}${path}`, {
    headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Shopify ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

async function shopifyGraphQL(shopDomain, accessToken, query) {
  const res = await fetch(`https://${shopDomain}/admin/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  return res.json();
}

// Best-effort attempt at session/conversion data via ShopifyQL. Needs the
// `read_reports`/analytics scope, which not every plan has — this is
// deliberately fail-soft (falls back to 0 with a logged reason) rather than
// pretending the number is real. Unverified against a live store — check it
// against yours before trusting the conversion-rate numbers.
async function tryPullSessions(shopDomain, accessToken, dateStr) {
  const query = `{
    shopifyqlQuery(query: "FROM sessions SHOW sessions, sessionsConverted SINCE '${dateStr}' UNTIL '${dateStr}'") {
      __typename
      ... on TableResponse { tableData { rowData } }
    }
  }`;
  try {
    const result = await shopifyGraphQL(shopDomain, accessToken, query);
    if (result.errors) return { sessions: 0, note: `sessions unavailable: ${result.errors[0].message}` };
    const rows = result?.data?.shopifyqlQuery?.tableData?.rowData;
    if (!rows || !rows.length) return { sessions: 0, note: 'sessions unavailable: no data returned' };
    const [sessions, sessionsConverted] = rows[0].map(Number);
    return { sessions: sessions || 0, sessionsConverted: sessionsConverted || 0, note: null };
  } catch (err) {
    return { sessions: 0, note: `sessions unavailable: ${err.message}` };
  }
}

export async function pullDay(store, dateStr) {
  const shopDomain = store.base_url;
  const accessToken = store.credentials?.accessToken;
  if (!shopDomain || !accessToken) throw new Error('Shopify store missing base_url or accessToken');

  const since = `${dateStr}T00:00:00Z`;
  const until = `${dateStr}T23:59:59Z`;
  const path = `/admin/api/2024-07/orders.json?status=any&created_at_min=${since}&created_at_max=${until}&limit=250`;

  const result = await shopifyRequest(shopDomain, accessToken, path);
  const orders = result.orders || [];
  const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0);

  const sessionData = await tryPullSessions(shopDomain, accessToken, dateStr);
  const conversionRate = sessionData.sessions > 0 ? (orders.length / sessionData.sessions) * 100 : 0;

  return {
    revenue,
    orders: orders.length,
    sessions: sessionData.sessions,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    ad_spend: 0,
    ad_revenue: 0
  };
}
