export async function pullDay(store, dateStr) {
  const baseUrl = store.base_url;
  if (!baseUrl) throw new Error('Custom store missing base_url');
  const url = `${baseUrl.replace(/\/$/, '')}/api/stats/daily?date=${dateStr}`;

  const res = await fetch(url, {
    headers: store.credentials?.apiKey ? { 'x-api-key': store.credentials.apiKey } : {}
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Custom store ${res.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);

  return {
    revenue: Number(json.revenue) || 0,
    orders: Number(json.orders) || 0,
    sessions: Number(json.sessions) || 0,
    conversion_rate: Number(json.conversion_rate) || 0,
    ad_spend: Number(json.ad_spend) || 0,
    ad_revenue: Number(json.ad_revenue) || 0
  };
}
