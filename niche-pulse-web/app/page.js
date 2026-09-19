'use client';
import { useEffect, useState, useCallback } from 'react';

function Sparkline({ metrics }) {
  const byDate = {};
  for (const m of metrics) byDate[m.date] = (byDate[m.date] || 0) + (m.revenue || 0);
  const dates = Object.keys(byDate).sort();
  if (dates.length < 2) return <div className="empty">Not enough data yet for a chart.</div>;

  const values = dates.map((d) => byDate[d]);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 600, h = 90, pad = 6;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polygon points={areaPoints} fill="rgba(167,139,250,0.12)" />
      <polyline points={points} fill="none" stroke="#a78bfa" strokeWidth="2" />
    </svg>
  );
}

function rankNichesClient(metrics, contentPushes) {
  const byNiche = {};
  for (const m of metrics) {
    const niche = m.niche_tag || 'unspecified';
    byNiche[niche] = byNiche[niche] || { days: [] };
    byNiche[niche].days.push(m);
  }
  const lastPush = {};
  for (const p of contentPushes) {
    if (!lastPush[p.niche_tag] || p.pushed_at > lastPush[p.niche_tag]) lastPush[p.niche_tag] = p.pushed_at;
  }
  return Object.entries(byNiche).map(([niche, data]) => {
    const days = data.days.sort((a, b) => a.date.localeCompare(b.date));
    const last7 = days.slice(-7);
    const prior7 = days.slice(-14, -7);
    const sum = (arr, key) => arr.reduce((s, d) => s + (d[key] || 0), 0);
    const rev7 = sum(last7, 'revenue');
    const revPrior7 = sum(prior7, 'revenue');
    const orders7 = sum(last7, 'orders');
    const trendPct = revPrior7 > 0 ? ((rev7 - revPrior7) / revPrior7) * 100 : null;
    const aov = orders7 > 0 ? rev7 / orders7 : 0;
    return { niche, rev7, trendPct, aov, lastPush: lastPush[niche] };
  }).sort((a, b) => (b.trendPct ?? -999) - (a.trendPct ?? -999));
}

export default function Dashboard() {
  const [state, setState] = useState({ stores: [], metrics: [], insights: [], contentPushes: [], hasApiKey: false });
  const [status, setStatus] = useState('');
  const [showAddStore, setShowAddStore] = useState(false);
  const [contentNiche, setContentNiche] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/state');
    const data = await res.json();
    setState(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function refreshNow() {
    setStatus('pulling data…');
    await fetch('/api/refresh', { method: 'POST' });
    await load();
    setStatus('');
  }

  async function generateInsights() {
    setStatus('generating insights…');
    const res = await fetch('/api/insights/generate', { method: 'POST' });
    const data = await res.json();
    if (data.error) setStatus(data.error);
    else setStatus('');
    await load();
  }

  async function dismissInsight(id) {
    await fetch(`/api/insights/${id}`, { method: 'DELETE' });
    await load();
  }

  async function logContentPush() {
    if (!contentNiche.trim()) return;
    await fetch('/api/content-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche_tag: contentNiche.trim() })
    });
    setContentNiche('');
    await load();
  }

  async function removeStore(id) {
    await fetch(`/api/stores/${id}`, { method: 'DELETE' });
    await load();
  }

  const niches = rankNichesClient(state.metrics, state.contentPushes);

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand">◆ NICHE PULSE</div>
        <div className="status">{status}</div>
      </div>

      {!state.hasApiKey && (
        <div className="banner">
          AI insights need <code>ANTHROPIC_API_KEY</code> set in this project&apos;s Vercel environment
          variables (Settings → Environment Variables), then redeploy.
        </div>
      )}

      <div className="btn-row">
        <button className="btn" onClick={refreshNow}>Refresh now</button>
        <button className="btn" onClick={generateInsights}>Generate insights</button>
        <button className="btn" onClick={() => setShowAddStore(true)}>+ Add store</button>
      </div>

      <div className="section-title">AI insights</div>
      {state.insights.length === 0 && <div className="empty">No insights yet.</div>}
      {state.insights.map((i) => (
        <div key={i.id} className={`insight ${i.severity}`}>
          <span className="x" onClick={() => dismissInsight(i.id)}>✕</span>
          <div className="tag">{i.store_name || 'cross-store'}</div>
          <div className="title">{i.title}</div>
          <div className="body">{i.body}</div>
        </div>
      ))}

      <div className="section-title">Log a content push</div>
      <div className="inline-log">
        <input placeholder="niche tag" value={contentNiche} onChange={(e) => setContentNiche(e.target.value)} />
        <button className="btn small" onClick={logContentPush}>Log</button>
      </div>

      <div className="section-title">Revenue — last 30 days, all stores</div>
      <div className="card">
        <Sparkline metrics={state.metrics} />
      </div>

      <div className="section-title">Niche ranking — where to focus next content push</div>
      {niches.length === 0 && <div className="empty">No data pulled yet.</div>}
      {niches.map((n) => (
        <div className="card" key={n.niche}>
          <div className="row"><span className="value">{n.niche}</span>
            <span className={n.trendPct === null ? 'trend-flat' : n.trendPct > 5 ? 'trend-up' : n.trendPct < -5 ? 'trend-down' : 'trend-flat'}>
              {n.trendPct === null ? 'n/a' : `${n.trendPct > 0 ? '+' : ''}${n.trendPct.toFixed(1)}%`}
            </span>
          </div>
          <div className="row"><span className="label">7d revenue</span><span>${n.rev7.toFixed(2)}</span></div>
          <div className="row"><span className="label">AOV</span><span>${n.aov.toFixed(2)}</span></div>
          <div className="row"><span className="label">Last content push</span><span>{n.lastPush ? new Date(n.lastPush).toLocaleDateString() : 'none logged'}</span></div>
        </div>
      ))}

      <div className="section-title">Connected stores</div>
      {state.stores.length === 0 && <div className="empty">No stores connected yet.</div>}
      {state.stores.map((s) => (
        <div className="card" key={s.id}>
          <div className="row">
            <span className="value">{s.name}</span>
            <button className="btn small" onClick={() => removeStore(s.id)}>remove</button>
          </div>
          <div className="label">{s.niche_tag || s.platform}</div>
        </div>
      ))}

      {showAddStore && <AddStoreSheet onClose={() => setShowAddStore(false)} onAdded={load} />}
    </div>
  );
}

function AddStoreSheet({ onClose, onAdded }) {
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('shopify');
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  function buildInput() {
    return {
      name, niche_tag: niche, platform, base_url: baseUrl,
      credentials: platform === 'shopify' ? { accessToken: token } : {}
    };
  }

  async function testConnection() {
    setTestResult({ pending: true });
    const res = await fetch('/api/stores/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildInput())
    });
    const data = await res.json();
    setTestResult(data);
  }

  async function save() {
    if (!name || !baseUrl) return;
    setSaving(true);
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildInput())
    });
    const data = await res.json();
    if (data.id) {
      // Kick off a 7-day backfill so the dashboard isn't empty — click
      // "Refresh now" / re-add later for more via the backfill endpoint.
      await fetch('/api/stores/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: data.id, days: 7 })
      });
    }
    setSaving(false);
    onAdded();
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>Add a store</h3>
        <label className="field">Display name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Coastal Candle Co." />
        </label>
        <label className="field">Niche tag
          <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="home fragrance" />
        </label>
        <label className="field">Platform
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="shopify">Shopify</option>
            <option value="custom">Custom (multicontainer / other)</option>
          </select>
        </label>
        <label className="field">{platform === 'shopify' ? 'Shop domain' : 'Base URL'}
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={platform === 'shopify' ? 'yourstore.myshopify.com' : 'https://multinicheai.com'} />
        </label>
        {platform === 'shopify' && (
          <label className="field">Admin API access token
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="shpat_..." />
          </label>
        )}
        {testResult && (
          <div className={`test-result ${testResult.pending ? '' : testResult.ok ? 'ok' : 'fail'}`}>
            {testResult.pending ? 'Testing…' : testResult.ok ? `✓ Connected — $${testResult.metrics.revenue.toFixed(2)} today` : `✗ ${testResult.error}`}
          </div>
        )}
        <div className="btn-row">
          <button className="btn" onClick={testConnection}>Test connection</button>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={saving}>{saving ? 'Adding…' : 'Add store'}</button>
        </div>
      </div>
    </div>
  );
}
