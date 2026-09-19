import { nextId } from './store.js';
import { generateInsights } from './insights.js';

export async function runInsightCycle(state, apiKey) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 21);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const rows = state.metrics.filter((m) => m.date >= cutoffStr);
  if (!rows.length) return [];

  const items = await generateInsights(apiKey, rows, state.contentPushes || []);
  const byName = Object.fromEntries(state.stores.map((s) => [s.name, s.id]));

  for (const item of items) {
    const id = nextId(state);
    state.insights.push({
      id,
      created_at: new Date().toISOString(),
      severity: item.severity || 'info',
      store_id: item.store ? byName[item.store] || null : null,
      store_name: item.store || null,
      title: item.title || 'Insight',
      body: item.body || '',
      dismissed: false
    });
  }
  // Keep the insight list from growing unbounded.
  state.insights = state.insights.slice(-200);

  return items;
}
