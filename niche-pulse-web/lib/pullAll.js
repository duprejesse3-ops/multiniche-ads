import * as shopify from './integrations/shopify.js';
import * as customStore from './integrations/customStore.js';

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function pullAllStores(state) {
  const date = todayStr();
  let ok = 0;
  let failed = 0;

  for (const store of state.stores) {
    try {
      const integration = store.platform === 'shopify' ? shopify : customStore;
      const metrics = await integration.pullDay(store, date);
      state.metrics = state.metrics.filter((m) => !(m.store_id === store.id && m.date === date));
      state.metrics.push({ store_id: store.id, store_name: store.name, niche_tag: store.niche_tag, date, ...metrics });
      ok++;
    } catch (err) {
      failed++;
      state.pullLog = state.pullLog || [];
      state.pullLog.push({ store_id: store.id, ran_at: new Date().toISOString(), ok: false, message: err.message });
    }
  }
  // Keep at most 90 days of metrics per store to stop the JSON document
  // growing unbounded — this is a JSON blob, not an indexed database.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  state.metrics = state.metrics.filter((m) => m.date >= cutoffStr);

  return { total: state.stores.length, ok, failed };
}
