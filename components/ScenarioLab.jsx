'use client';

import { useEffect, useMemo, useState } from 'react';
import { getQuarters } from '@/lib/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

const SHARES = 2000000;

const fmt = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('en-GB');
};

function estimateSharePrice(baseSharePrice, epsPence, netMarginPct) {
  const epsFactor = epsPence > 0 ? Math.min(40, epsPence * 1.2) : Math.max(-35, epsPence * 1.8);
  const marginFactor = (netMarginPct - 10) * 1.5;
  const projected = baseSharePrice + epsFactor + marginFactor;
  return Math.max(25, projected);
}

export default function ScenarioLab({ groupNumber, companyNumber }) {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [revChangePct, setRevChangePct] = useState(8);
  const [cosChangePct, setCosChangePct] = useState(-4);
  const [ohChangePct, setOhChangePct] = useState(-3);
  const [taxRatePct, setTaxRatePct] = useState(19);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getQuarters(groupNumber, companyNumber);
        setQuarters(data || []);
      } catch (e) {
        console.error('ScenarioLab load error:', e);
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

  const baseRevenue = Number(pl.salesRevenue || 0);
  const baseCost = Number(pl.costOfSales || 0);
  const baseOverheads = Number(pl.totalOverheads || 0);
  const baseSharePrice = Number(r.sharePrice || 100);
  const netAssets = Number(bs.netAssets || bs.totalNetAssets || 0);

  const projectedRevenue = baseRevenue * (1 + revChangePct / 100);
  const projectedCost = baseCost * (1 + cosChangePct / 100);
  const projectedOverheads = baseOverheads * (1 + ohChangePct / 100);
  const projectedOperatingProfit = projectedRevenue - projectedCost - projectedOverheads;
  const projectedTax = Math.max(0, projectedOperatingProfit * (taxRatePct / 100));
  const projectedNetProfit = projectedOperatingProfit - projectedTax;
  const projectedGrossProfit = projectedRevenue - projectedCost;

  const grossMarginPct = projectedRevenue > 0 ? (projectedGrossProfit / projectedRevenue) * 100 : 0;
  const netMarginPct = projectedRevenue > 0 ? (projectedNetProfit / projectedRevenue) * 100 : 0;
  const rocePct = netAssets > 0 ? (projectedNetProfit / netAssets) * 100 : 0;
  const epsPence = (projectedNetProfit / SHARES) * 100;
  const projectedSharePrice = estimateSharePrice(baseSharePrice, epsPence, netMarginPct);
  const peRatio = epsPence > 0 ? projectedSharePrice / epsPence : null;

  const bridge = useMemo(() => [
    { step: 'Revenue', value: Math.round(projectedRevenue / 1000) },
    { step: 'Cost Of Sales', value: -Math.round(projectedCost / 1000) },
    { step: 'Overheads', value: -Math.round(projectedOverheads / 1000) },
    { step: 'Tax', value: -Math.round(projectedTax / 1000) },
    { step: 'Net Profit', value: Math.round(projectedNetProfit / 1000) },
  ], [projectedRevenue, projectedCost, projectedOverheads, projectedTax, projectedNetProfit]);

  if (loading) return <div className="d-card">Loading scenario lab...</div>;

  if (!latest) {
    return (
      <div className="d-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 16, color: '#0F172A', marginBottom: 8 }}>Scenario lab needs baseline data</div>
        <div style={{ color: '#64748B' }}>Submit one quarter first, then run strategic what-if scenarios.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#0F172A' }}>Scenario and Forecast Lab</h1>
        <div className="mono" style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
          Strategy sandbox from baseline Year {latest.year} Q{latest.quarter}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="d-card">
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>Assumptions</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label className="fl">Revenue Change %: {revChangePct}%</label>
              <input className="fi" type="range" min={-30} max={40} value={revChangePct} onChange={(e) => setRevChangePct(Number(e.target.value))} />
            </div>
            <div>
              <label className="fl">Cost Of Sales Change %: {cosChangePct}%</label>
              <input className="fi" type="range" min={-30} max={35} value={cosChangePct} onChange={(e) => setCosChangePct(Number(e.target.value))} />
            </div>
            <div>
              <label className="fl">Overheads Change %: {ohChangePct}%</label>
              <input className="fi" type="range" min={-35} max={35} value={ohChangePct} onChange={(e) => setOhChangePct(Number(e.target.value))} />
            </div>
            <div>
              <label className="fl">Tax Rate %: {taxRatePct}%</label>
              <input className="fi" type="range" min={0} max={35} value={taxRatePct} onChange={(e) => setTaxRatePct(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="d-card">
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>Projected Financial Outcome</div>
          <div className="sc-row"><span className="report-label">Projected Revenue</span><span className="report-value mono">&pound;{fmt(Math.round(projectedRevenue))}</span></div>
          <div className="sc-row"><span className="report-label">Projected Gross Profit</span><span className="report-value mono">&pound;{fmt(Math.round(projectedGrossProfit))}</span></div>
          <div className="sc-row"><span className="report-label">Projected Net Profit</span><span className={`report-value mono ${projectedNetProfit >= 0 ? 'val-pos' : 'val-neg'}`}>&pound;{fmt(Math.round(projectedNetProfit))}</span></div>
          <div className="sc-row"><span className="report-label">Gross Margin %</span><span className={`report-value mono ${grossMarginPct >= 40 ? 'val-pos' : grossMarginPct >= 25 ? 'val-warn' : 'val-neg'}`}>{grossMarginPct.toFixed(1)}%</span></div>
          <div className="sc-row"><span className="report-label">Net Margin %</span><span className={`report-value mono ${netMarginPct >= 10 ? 'val-pos' : netMarginPct >= 5 ? 'val-warn' : 'val-neg'}`}>{netMarginPct.toFixed(1)}%</span></div>
          <div className="sc-row"><span className="report-label">ROCE %</span><span className={`report-value mono ${rocePct >= 15 ? 'val-pos' : rocePct >= 5 ? 'val-warn' : 'val-neg'}`}>{rocePct.toFixed(1)}%</span></div>
          <div className="sc-row"><span className="report-label">EPS (p)</span><span className={`report-value mono ${epsPence >= 5 ? 'val-pos' : epsPence > 0 ? 'val-warn' : 'val-neg'}`}>{epsPence.toFixed(2)}p</span></div>
          <div className="sc-row"><span className="report-label">Estimated Share Price</span><span className="report-value mono" style={{ color: '#6366F1' }}>{projectedSharePrice.toFixed(1)}p</span></div>
          <div className="sc-row"><span className="report-label">Estimated P/E</span><span className="report-value mono">{peRatio ? `${peRatio.toFixed(1)}x` : 'N/A'}</span></div>
        </div>
      </div>

      <div className="d-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Scenario Profit Bridge (£k)</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={bridge}>
            <defs>
              <linearGradient id="profitBridge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="step" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="value" stroke="#6366F1" fill="url(#profitBridge)" name="Value (£k)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="d-card">
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 10 }}>Strategy Notes</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', lineHeight: 1.7, fontSize: 13 }}>
          <li>Revenue changes represent combined impact of pricing, market mix, and demand response.</li>
          <li>Cost and overhead assumptions can model operational efficiency programs.</li>
          <li>Estimated share price is a planning proxy based on EPS and net margin momentum.</li>
          <li>Use this module before quarter submission to test upside/downside playbooks.</li>
        </ul>
      </div>
    </div>
  );
}
