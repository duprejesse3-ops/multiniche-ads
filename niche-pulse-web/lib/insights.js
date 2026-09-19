import { detectAnomalies, forecastNext7, rankNiches } from './analytics.js';

async function callClaude(apiKey, systemPrompt, userMessage) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });
  const parsed = await res.json();
  if (parsed.error) throw new Error(parsed.error.message || 'Anthropic API error');
  return (parsed.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

function summarizeForPrompt(rows) {
  const byStore = {};
  for (const r of rows) {
    byStore[r.store_name] = byStore[r.store_name] || { niche: r.niche_tag, days: [] };
    byStore[r.store_name].days.push(r);
  }
  const lines = [];
  for (const [name, data] of Object.entries(byStore)) {
    const days = data.days.sort((a, b) => a.date.localeCompare(b.date));
    const last7 = days.slice(-7);
    const prior7 = days.slice(-14, -7);
    const sum = (arr, key) => arr.reduce((s, d) => s + (d[key] || 0), 0);
    const rev7 = sum(last7, 'revenue');
    const revPrior7 = sum(prior7, 'revenue');
    const pctChange = revPrior7 > 0 ? (((rev7 - revPrior7) / revPrior7) * 100).toFixed(1) : 'n/a';
    lines.push(`- ${name} (niche: ${data.niche || 'unspecified'}): last 7d revenue $${rev7.toFixed(2)} (${pctChange}% vs prior 7d), orders ${sum(last7, 'orders')}`);
  }
  return lines.join('\n');
}

function formatContentPushes(pushes) {
  if (!pushes.length) return 'No content pushes logged in the last 3 weeks.';
  const byNiche = {};
  for (const p of pushes) byNiche[p.niche_tag] = (byNiche[p.niche_tag] || 0) + 1;
  return Object.entries(byNiche).map(([niche, count]) => `- ${niche}: ${count} content push(es)`).join('\n');
}

export async function generateInsights(apiKey, rows, contentPushes = []) {
  if (!rows.length) return [];
  const summary = summarizeForPrompt(rows);
  const anomalies = detectAnomalies(rows);
  const forecasts = forecastNext7(rows);
  const niches = rankNiches(rows);
  const contentSummary = formatContentPushes(contentPushes);

  const anomalyText = anomalies.length
    ? anomalies.map((a) => `- ${a.store}: ${a.direction} on ${a.date} — $${a.revenue} vs baseline avg $${a.baselineMean} (z=${a.z})`).join('\n')
    : 'None detected.';
  const forecastText = forecasts.map((f) => `- ${f.store}: trend ${f.trend}, projected next 7d revenue $${f.projectedNext7Revenue}`).join('\n');
  const nicheText = niches.map((n) => `- ${n.niche}: 7d revenue $${n.revenue7d}, trend ${n.trendPct === null ? 'n/a' : n.trendPct + '%'}, AOV $${n.aov}`).join('\n');

  const systemPrompt = `You analyze cross-store e-commerce performance data for someone running multiple small niche stores at once, whose main growth lever is organic content (not paid ads). All numbers below are pre-computed in code — do not invent, recompute, or contradict them, only reason about and explain them. Output ONLY a JSON array, no prose, no markdown fences. Each item: {"severity": "opportunity"|"warning"|"info", "store": "<store name or null>", "title": "<max 8 words>", "body": "<1-3 sentences, specific, actionable>"}. Produce 4-7 items. Prioritize: (1) statistical anomalies, (2) which niche most deserves the next content push (use niche ranking + content-push log together), (3) revenue forecasts worth flagging, (4) other cross-store patterns.`;

  const userMessage = `Weekly summary per store:\n${summary}\n\nStatistical anomalies (z-score >= 2 vs 13-day baseline):\n${anomalyText}\n\n7-day forward revenue trend per store:\n${forecastText}\n\nNiche ranking (7d revenue, trend, AOV):\n${nicheText}\n\nContent pushes logged (last 3 weeks):\n${contentSummary}`;

  const raw = await callClaude(apiKey, systemPrompt, userMessage);
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  try {
    const items = JSON.parse(cleaned);
    return Array.isArray(items) ? items : [];
  } catch (e) {
    return [{ severity: 'info', store: null, title: 'Insight generation partially failed', body: 'The AI response could not be parsed this run — will retry next cycle.' }];
  }
}
