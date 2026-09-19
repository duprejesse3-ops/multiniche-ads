function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function groupByStore(rows) {
  const byStore = {};
  for (const r of rows) {
    byStore[r.store_name] = byStore[r.store_name] || { niche: r.niche_tag, days: [] };
    byStore[r.store_name].days.push(r);
  }
  for (const s of Object.values(byStore)) s.days.sort((a, b) => a.date.localeCompare(b.date));
  return byStore;
}

// Flags a store as anomalous if yesterday's revenue is more than 2 standard
// deviations from the trailing 13-day mean (excluding yesterday itself).
// This is real statistics on real numbers — not a pattern the LLM eyeballed.
function detectAnomalies(rows) {
  const byStore = groupByStore(rows);
  const anomalies = [];

  for (const [name, data] of Object.entries(byStore)) {
    const days = data.days;
    if (days.length < 8) continue; // not enough history to trust a stddev yet

    const latest = days[days.length - 1];
    const baseline = days.slice(0, -1).slice(-13).map((d) => d.revenue || 0);
    const m = mean(baseline);
    const sd = stddev(baseline);
    if (sd === 0) continue;

    const z = (latest.revenue - m) / sd;
    if (Math.abs(z) >= 2) {
      anomalies.push({
        store: name,
        niche: data.niche,
        date: latest.date,
        revenue: latest.revenue,
        baselineMean: Math.round(m * 100) / 100,
        z: Math.round(z * 100) / 100,
        direction: z > 0 ? 'spike' : 'drop'
      });
    }
  }
  return anomalies;
}

// Simple linear regression over the trailing 14 days of revenue, projected
// forward 7 days. Deliberately simple (least-squares on day-index vs
// revenue) — good enough to say "trending up/down/flat", not a claim of
// precise forecasting accuracy.
function forecastNext7(rows) {
  const byStore = groupByStore(rows);
  const forecasts = [];

  for (const [name, data] of Object.entries(byStore)) {
    const days = data.days.slice(-14);
    if (days.length < 6) continue;

    const xs = days.map((_, i) => i);
    const ys = days.map((d) => d.revenue || 0);
    const n = xs.length;
    const xMean = mean(xs);
    const yMean = mean(ys);
    const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
    const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;

    const nextDayRevenue = intercept + slope * n;
    const projected7 = Array.from({ length: 7 }, (_, k) => Math.max(0, intercept + slope * (n + k)))
      .reduce((a, b) => a + b, 0);

    forecasts.push({
      store: name,
      niche: data.niche,
      dailySlope: Math.round(slope * 100) / 100,
      trend: slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'flat',
      projectedNext7Revenue: Math.round(projected7 * 100) / 100
    });
  }
  return forecasts;
}

// Ranks niches (which may span multiple stores) by revenue trend and AOV —
// the two numbers that matter for "where should the next content push go."
function rankNiches(rows) {
  const byNiche = {};
  for (const r of rows) {
    const niche = r.niche_tag || 'unspecified';
    byNiche[niche] = byNiche[niche] || { days: [], stores: new Set() };
    byNiche[niche].days.push(r);
    byNiche[niche].stores.add(r.store_name);
  }

  const ranked = [];
  for (const [niche, data] of Object.entries(byNiche)) {
    const days = data.days.sort((a, b) => a.date.localeCompare(b.date));
    const last7 = days.slice(-7);
    const prior7 = days.slice(-14, -7);
    const sum = (arr, key) => arr.reduce((s, d) => s + (d[key] || 0), 0);
    const rev7 = sum(last7, 'revenue');
    const revPrior7 = sum(prior7, 'revenue');
    const orders7 = sum(last7, 'orders');
    const trendPct = revPrior7 > 0 ? ((rev7 - revPrior7) / revPrior7) * 100 : null;
    const aov = orders7 > 0 ? rev7 / orders7 : 0;

    ranked.push({
      niche,
      stores: [...data.stores],
      revenue7d: Math.round(rev7 * 100) / 100,
      trendPct: trendPct === null ? null : Math.round(trendPct * 10) / 10,
      aov: Math.round(aov * 100) / 100,
      orders7d: orders7
    });
  }

  return ranked.sort((a, b) => (b.trendPct ?? -999) - (a.trendPct ?? -999));
}

export { detectAnomalies, forecastNext7, rankNiches, mean, stddev };
