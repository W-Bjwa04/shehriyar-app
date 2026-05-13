'use client';

import { useEffect, useMemo, useState } from 'react';
import { getQuarters } from '@/lib/api';
import { AlertTriangle, Shield, Target, Gauge } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const fmt = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('en-GB');
};

function healthClass(score) {
  if (score >= 75) return 'val-pos';
  if (score >= 45) return 'val-warn';
  return 'val-neg';
}

export default function ControlCenter({ groupNumber, companyNumber, onNavigate }) {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState({
    pricingReview: false,
    staffingPlan: false,
    capexPlan: false,
    cashPlan: false,
    competitorScan: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getQuarters(groupNumber, companyNumber);
        setQuarters(data || []);
      } catch (e) {
        console.error('ControlCenter load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupNumber, companyNumber]);

  const latest = quarters.length ? quarters[quarters.length - 1] : null;
  const r = latest?.results || {};
  const pl = r.profitAndLoss || {};
  const bs = r.balanceSheet || {};
  const bsA = bs.assets || {};
  const bsL = bs.liabilities || {};

  const salesRevenue = Number(pl.salesRevenue || 0);
  const grossProfit = Number(pl.grossProfit || 0);
  const netProfit = Number(pl.netProfit || 0);
  const totalOverheads = Number(pl.totalOverheads || 0);
  const sharePrice = Number(r.sharePrice || 0);
  const netAssets = Number(bs.netAssets || bs.totalNetAssets || 0);

  const curAssets = Number(bsA.stock || 0) + Number(bsA.debtors || 0) + Number(bsA.cash || 0);
  const curLiab = Number(bsL.creditors || 0) + Number(bsL.taxation || 0) + Number(bsL.dividends || 0);
  const currentRatio = curLiab > 0 ? curAssets / curLiab : 0;
  const grossMargin = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;
  const netMargin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0;
  const overheadRatio = salesRevenue > 0 ? (totalOverheads / salesRevenue) * 100 : 0;
  const capUsed = Number(r.assemblyHours?.worked || r.assemblyHours?.used || 0);
  const capAvail = Number(r.assemblyHours?.available || 0);
  const capUtil = capAvail > 0 ? (capUsed / capAvail) * 100 : 0;

  const riskScore = Math.max(0,
    100
    - (grossMargin >= 40 ? 0 : 20)
    - (netMargin >= 10 ? 0 : 20)
    - (currentRatio >= 1.5 ? 0 : 20)
    - (sharePrice >= 100 ? 0 : 20)
    - (capUtil >= 70 && capUtil <= 90 ? 0 : 20)
  );

  const chartData = useMemo(() => quarters.map((q) => {
    const rr = q.results || {};
    const ppl = rr.profitAndLoss || {};
    const bbs = rr.balanceSheet || {};
    const aa = bbs.assets || {};
    const ll = bbs.liabilities || {};
    const sr = Number(ppl.salesRevenue || 0);
    const np = Number(ppl.netProfit || 0);
    const ca = Number(aa.stock || 0) + Number(aa.debtors || 0) + Number(aa.cash || 0);
    const cl = Number(ll.creditors || 0) + Number(ll.taxation || 0) + Number(ll.dividends || 0);
    return {
      label: `Y${q.year}Q${q.quarter}`,
      sharePrice: Number(rr.sharePrice || 0),
      netProfit: Math.round(np / 1000),
      currentRatio: cl > 0 ? parseFloat((ca / cl).toFixed(2)) : 0,
      overheadRatio: sr > 0 ? parseFloat((Number(ppl.totalOverheads || 0) / sr * 100).toFixed(1)) : 0,
    };
  }), [quarters]);

  const commandQueue = [
    { id: 'pricingReview', label: 'Finalize pricing and demand assumptions', owner: 'Commercial' },
    { id: 'staffingPlan', label: 'Approve sales and assembly staffing plan', owner: 'HR/Ops' },
    { id: 'capexPlan', label: 'Lock machine and van investment decisions', owner: 'Operations' },
    { id: 'cashPlan', label: 'Set credit terms and dividend policy', owner: 'Finance' },
    { id: 'competitorScan', label: 'Review market intelligence before submit', owner: 'Strategy' },
  ];

  if (loading) return <div className="d-card">Loading control center...</div>;

  if (!latest) {
    return (
      <div className="d-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 16, color: '#0F172A', marginBottom: 6 }}>No data available yet</div>
        <div style={{ color: '#64748B', marginBottom: 14 }}>Submit at least one quarter to unlock command-center features.</div>
        <button className="btn-primary" onClick={() => onNavigate('form')}>Go To Decision Form</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#0F172A' }}>Executive Control Center</h1>
        <div className="mono" style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
          Group {groupNumber} | Company {companyNumber} | Year {latest.year} Q{latest.quarter}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-tile">
          <div className="stat-tile-label">Risk Exposure Score</div>
          <div className={`stat-tile-value ${healthClass(100 - riskScore)}`}>{Math.round(riskScore)}/100</div>
          <div className="stat-tile-delta" style={{ color: '#64748B' }}>Lower is better</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Share Price</div>
          <div className="stat-tile-value" style={{ color: '#6366F1' }}>{sharePrice.toFixed(1)}p</div>
          <div className="stat-tile-delta" style={{ color: '#64748B' }}>Target {'>='} 150p</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Net Profit</div>
          <div className={`stat-tile-value ${netProfit >= 0 ? 'val-pos' : 'val-neg'}`}>&pound;{fmt(netProfit)}</div>
          <div className="stat-tile-delta" style={{ color: '#64748B' }}>Quarterly actual</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Current Ratio</div>
          <div className={`stat-tile-value ${currentRatio >= 1.5 ? 'val-pos' : currentRatio >= 1 ? 'val-warn' : 'val-neg'}`}>{currentRatio.toFixed(2)}</div>
          <div className="stat-tile-delta" style={{ color: '#64748B' }}>Target {'>='} 1.50</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="d-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#0F172A' }}>Covenant Monitor</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="dt">
              <thead>
                <tr><th>Control</th><th>Value</th><th>Threshold</th><th>Status</th></tr>
              </thead>
              <tbody>
                {[
                  { name: 'Gross Margin %', value: grossMargin, threshold: '>= 40%', ok: grossMargin >= 40, warn: grossMargin >= 25 },
                  { name: 'Net Margin %', value: netMargin, threshold: '>= 10%', ok: netMargin >= 10, warn: netMargin >= 5 },
                  { name: 'Overhead Ratio %', value: overheadRatio, threshold: '<= 40%', ok: overheadRatio <= 40, warn: overheadRatio <= 55 },
                  { name: 'Current Ratio', value: currentRatio, threshold: '>= 1.50', ok: currentRatio >= 1.5, warn: currentRatio >= 1 },
                  { name: 'Capacity Utilization %', value: capUtil, threshold: '70% to 90%', ok: capUtil >= 70 && capUtil <= 90, warn: capUtil >= 55 && capUtil <= 95 },
                  { name: 'Net Assets', value: netAssets, threshold: '> 0', ok: netAssets > 0, warn: netAssets >= -50000 },
                ].map((m) => (
                  <tr key={m.name}>
                    <td>{m.name}</td>
                    <td className={`mono ${m.ok ? 'val-pos' : m.warn ? 'val-warn' : 'val-neg'}`}>
                      {m.name.includes('%') ? `${m.value.toFixed(1)}%` : m.name === 'Net Assets' ? `£${fmt(m.value)}` : m.value.toFixed(2)}
                    </td>
                    <td style={{ color: '#64748B' }}>{m.threshold}</td>
                    <td>
                      <span className={`badge ${m.ok ? 'badge-green' : m.warn ? 'badge-amber' : 'badge-red'}`}>
                        {m.ok ? 'Compliant' : m.warn ? 'Watch' : 'Breach'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#0F172A' }}>Command Queue</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {commandQueue.map((item) => (
              <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: '1px solid #E2E8F0', borderRadius: 10, padding: 10, background: '#FFFFFF' }}>
                <input
                  type="checkbox"
                  checked={checks[item.id]}
                  onChange={(e) => setChecks((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Owner: {item.owner}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#64748B' }}>
            Completion: <span className="mono">{Object.values(checks).filter(Boolean).length}/{commandQueue.length}</span>
          </div>
        </div>
      </div>

      <div className="d-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#0F172A' }}>Quarter Trend Snapshot</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="netProfit" fill="#15803D" name="Net Profit (£k)" />
            <Bar yAxisId="right" dataKey="sharePrice" fill="#6366F1" name="Share Price (p)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-4">
        <div className="d-card-sm" style={{ background: '#EEF2FF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><AlertTriangle size={14} /><strong style={{ fontSize: 12 }}>Risk</strong></div>
          <div style={{ fontSize: 12, color: '#334155' }}>Automated covenant checks and breach watchlist every quarter.</div>
        </div>
        <div className="d-card-sm" style={{ background: '#ECFDF5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Shield size={14} /><strong style={{ fontSize: 12 }}>Governance</strong></div>
          <div style={{ fontSize: 12, color: '#334155' }}>Pre-submit command checklist for disciplined decision execution.</div>
        </div>
        <div className="d-card-sm" style={{ background: '#FEF3C7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Target size={14} /><strong style={{ fontSize: 12 }}>Targets</strong></div>
          <div style={{ fontSize: 12, color: '#334155' }}>Benchmarks for margins, liquidity, and utilization in one place.</div>
        </div>
        <div className="d-card-sm" style={{ background: '#E0F2FE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Gauge size={14} /><strong style={{ fontSize: 12 }}>Performance</strong></div>
          <div style={{ fontSize: 12, color: '#334155' }}>Rapid executive pulse before submitting a quarter.</div>
        </div>
      </div>
    </div>
  );
}
