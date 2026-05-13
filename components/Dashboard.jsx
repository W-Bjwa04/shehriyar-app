'use client';

import { useState, useEffect } from 'react';
import { getQuarters, resetSimulation, seedDatabase } from '@/lib/api';
import { toast } from 'react-toastify';
import { Database, Trash2, Plus, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const fmt = (n) => {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-GB');
};

const gmColor = (pct) => {
  if (pct >= 40) return '#15803D';
  if (pct >= 20) return '#B45309';
  return '#DC2626';
};
const nmColor = (pct) => {
  if (pct >= 10) return '#15803D';
  if (pct >= 5) return '#B45309';
  return '#DC2626';
};
const atColor = (v) => {
  if (v >= 1.0) return '#15803D';
  if (v >= 0.5) return '#B45309';
  return '#DC2626';
};
const cuColor = (pct) => {
  if (pct >= 70 && pct <= 90) return '#15803D';
  if (pct >= 50) return '#B45309';
  return '#DC2626';
};

const DARK_TOOLTIP = {
  contentStyle: {
    background: '#FFFFFF', border: '1px solid #E2E8F0',
    borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
  },
  labelStyle: { color: '#475569' },
};

export default function Dashboard({ onNavigate, groupNumber, companyNumber, onGroupChange, onCompanyChange }) {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => { loadQuarters(); }, [groupNumber, companyNumber]);

  const loadQuarters = async () => {
    try {
      setLoading(true);
      const { data } = await getQuarters(groupNumber, companyNumber);
      setQuarters(data);
    } catch (err) {
      console.error('Failed to load quarters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    try {
      await resetSimulation(groupNumber, companyNumber);
      toast.success('Simulation reset — all values set to zero');
      setResetConfirm(false);
      loadQuarters();
    } catch (err) {
      toast.error('Failed to reset simulation');
    }
  };

  const handleSeed = async () => {
    try {
      const { data } = await seedDatabase();
      toast.success(data.message || 'Seed data loaded successfully');
      loadQuarters();
    } catch (err) {
      toast.error('Failed to seed data');
    }
  };

  const latest = quarters.length > 0 ? quarters[quarters.length - 1] : null;
  const prev = quarters.length > 1 ? quarters[quarters.length - 2] : null;
  const r = latest?.results;
  const rp = prev?.results;

  // KPI computations
  const sharePrice = Number(r?.sharePrice || 0);
  const netProfit = Number(r?.profitAndLoss?.netProfit || 0);
  const salesRevenue = Number(r?.profitAndLoss?.salesRevenue || 0);
  const grossProfit = Number(r?.profitAndLoss?.grossProfit || 0);
  const netAssets = Number(r?.balanceSheet?.netAssets || 0);
  const grossMarginPct = salesRevenue > 0 ? (grossProfit / salesRevenue * 100) : 0;
  const netMarginPct = salesRevenue > 0 ? (netProfit / salesRevenue * 100) : 0;
  const assetTurnover = netAssets > 0 ? (salesRevenue / netAssets) : 0;
  const hoursUsed = Number(r?.assemblyHours?.worked || r?.assemblyHours?.used || 0);
  const hoursAvail = Number(r?.assemblyHours?.available || 0);
  const capUtilPct = hoursAvail > 0 ? (hoursUsed / hoursAvail * 100) : 0;
  const eps = netProfit / 2000000;

  // Balance sheet ratios
  const bsFA = r?.balanceSheet?.assets || {};
  const bsLia = r?.balanceSheet?.liabilities || {};
  const curAssets = Number(bsFA.stock || 0) + Number(bsFA.debtors || 0) + Number(bsFA.cash || 0);
  const curLiab = Number(bsLia.creditors || 0) + Number(bsLia.taxation || 0) + Number(bsLia.dividends || 0);
  const workingCapital = curAssets - curLiab;
  const currentRatio = curLiab > 0 ? curAssets / curLiab : null;
  const roce = netAssets > 0 ? (netProfit / netAssets) * 100 : 0;
  const totalLoans = Number(bsLia.loans || bsLia.longTermLoans || 0);
  const gearing = (netAssets + totalLoans) > 0 ? (totalLoans / (netAssets + totalLoans)) * 100 : 0;
  const totalSP = Object.values(r?.salespeople || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const awTotal = Number(r?.assemblyWorkers?.total || 0);
  const revenuePerEmp = (totalSP + awTotal) > 0 ? salesRevenue / (totalSP + awTotal) : 0;
  const overheadRatio = salesRevenue > 0 ? (Number(r?.profitAndLoss?.totalOverheads || 0) / salesRevenue) * 100 : 0;
  const dividendYield = sharePrice > 0 ? (Number(latest?.decisions?.dividendRate || 0) / sharePrice) * 100 : 0;
  const peRatio = eps > 0 ? (sharePrice / (eps * 100)) : null;

  // Financial health grade (0–100 score)
  const healthScore = (() => {
    let s = 0;
    if (grossMarginPct >= 40) s += 25; else if (grossMarginPct >= 25) s += 15; else if (grossMarginPct > 0) s += 5;
    if (netMarginPct >= 10) s += 25; else if (netMarginPct >= 5) s += 15; else if (netMarginPct > 0) s += 8;
    if (sharePrice >= 150) s += 25; else if (sharePrice >= 100) s += 15; else if (sharePrice >= 80) s += 5;
    if (currentRatio !== null) { if (currentRatio >= 2) s += 25; else if (currentRatio >= 1.5) s += 18; else if (currentRatio >= 1) s += 10; else s += 2; }
    return s;
  })();
  const healthGrade = healthScore >= 90 ? { g: 'A+', c: '#15803D', l: 'Excellent' }
    : healthScore >= 75 ? { g: 'A', c: '#15803D', l: 'Strong' }
    : healthScore >= 60 ? { g: 'B', c: '#6366F1', l: 'Good' }
    : healthScore >= 45 ? { g: 'C', c: '#B45309', l: 'Satisfactory' }
    : healthScore >= 25 ? { g: 'D', c: '#DC2626', l: 'Weak' }
    : { g: 'F', c: '#B91C1C', l: 'Critical' };

  // Previous KPIs for deltas
  const prevSharePrice = Number(rp?.sharePrice || 0);
  const prevNetProfit = Number(rp?.profitAndLoss?.netProfit || 0);
  const prevSalesRevenue = Number(rp?.profitAndLoss?.salesRevenue || 0);
  const prevGrossProfit = Number(rp?.profitAndLoss?.grossProfit || 0);
  const prevGrossMarginPct = prevSalesRevenue > 0 ? (prevGrossProfit / prevSalesRevenue * 100) : 0;
  const prevNetAssets = Number(rp?.balanceSheet?.netAssets || 0);

  // Chart data
  const chartData = quarters.map((q) => {
    const sr = Number(q.results?.profitAndLoss?.salesRevenue || 0);
    const gp = Number(q.results?.profitAndLoss?.grossProfit || 0);
    const np = Number(q.results?.profitAndLoss?.netProfit || 0);
    const oh = Number(q.results?.profitAndLoss?.totalOverheads || 0);
    const cs = Number(q.results?.profitAndLoss?.costOfSales || 0);
    const na = Number(q.results?.balanceSheet?.netAssets || 0);
    return {
      name: `Q${q.quarter} '${String(q.year).slice(2)}`,
      sharePrice: Number(q.results?.sharePrice || 0),
      netProfit: Math.round(np / 1000),
      grossMargin: sr > 0 ? parseFloat((gp / sr * 100).toFixed(1)) : 0,
      revenue: Math.round(sr / 1000),
      costOfSales: Math.round(cs / 1000),
      overheads: Math.round(oh / 1000),
      grossProfit: Math.round(gp / 1000),
      roce: na > 0 ? parseFloat((np / na * 100).toFixed(1)) : 0,
      eps: parseFloat((np / 2000000 * 100).toFixed(2)),
    };
  });

  const Delta = ({ curr, prev, prefix = '', suffix = '', divisor = 1 }) => {
    if (!rp) return null;
    const diff = (curr - prev) / divisor;
    const pos = diff >= 0;
    return (
      <div className={`stat-tile-delta ${pos ? 'val-pos' : 'val-neg'}`}>
        {pos ? '↑' : '↓'} {prefix}{Math.abs(diff).toFixed(divisor === 1 ? 0 : 1)}{suffix} vs prev
      </div>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {/* A. Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0F172A', margin: 0 }}>Overview</h1>
          {latest && (
            <div className="mono" style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Q{latest.quarter} {latest.year} · Group {groupNumber} · Co {companyNumber}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {r && (
            <div title={`Financial Health: ${healthGrade.l} (${healthScore}/100)`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, border: `1px solid ${healthGrade.c}30`, background: `${healthGrade.c}0D` }}>
              <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: healthGrade.c, lineHeight: 1 }}>{healthGrade.g}</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: healthGrade.c }}>Health</div>
                <div style={{ fontSize: 10, color: '#64748B' }}>{healthGrade.l}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={handleSeed}>
            <Database size={14} /> Load Seed
          </button>
          <button
            className={`btn-danger${resetConfirm ? ' confirm' : ''}`}
            onClick={handleReset}
          >
            <Trash2 size={14} /> {resetConfirm ? 'Confirm?' : 'Reset'}
          </button>
          <button className="btn-primary" onClick={() => onNavigate('form')}>
            <Plus size={14} /> Decision
          </button>
          </div>
        </div>
      </div>

      {/* B. Stat Tiles */}
      {r && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-tile">
            <div className="stat-tile-label">Share Price</div>
            <div className="stat-tile-value" style={{ color: '#6366F1' }}>{sharePrice.toFixed(1)}p</div>
            <Delta curr={sharePrice} prev={prevSharePrice} suffix="p" divisor={1} />
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Net Profit</div>
            <div className={`stat-tile-value ${netProfit >= 0 ? 'val-pos' : 'val-neg'}`}>£{fmt(netProfit)}</div>
            <Delta curr={netProfit} prev={prevNetProfit} prefix="£" divisor={1} />
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Gross Margin</div>
            <div className="stat-tile-value" style={{ color: gmColor(grossMarginPct) }}>
              {grossMarginPct.toFixed(1)}%
            </div>
            <Delta curr={grossMarginPct} prev={prevGrossMarginPct} suffix="%" divisor={1} />
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Net Assets</div>
            <div className="stat-tile-value" style={{ color: '#0F172A' }}>£{fmt(netAssets)}</div>
            <Delta curr={netAssets} prev={prevNetAssets} prefix="£" divisor={1} />
          </div>
        </div>
      )}

      {/* C. Financial Health Strip */}
      {r && (
        <>
        <div className="grid-5" style={{ marginBottom: 24 }}>
          <div className="ratio-tile">
            <div className="ratio-tile-label">Gross Margin %</div>
            <div className="ratio-tile-value" style={{ color: gmColor(grossMarginPct) }}>
              {grossMarginPct.toFixed(1)}%
            </div>
            <div className="ratio-tile-bench">Healthy &gt; 40%</div>
          </div>
          <div className="ratio-tile">
            <div className="ratio-tile-label">Net Margin %</div>
            <div className="ratio-tile-value" style={{ color: nmColor(netMarginPct) }}>
              {netMarginPct.toFixed(1)}%
            </div>
            <div className="ratio-tile-bench">Healthy &gt; 10%</div>
          </div>
          <div className="ratio-tile">
            <div className="ratio-tile-label">Asset Turnover</div>
            <div className="ratio-tile-value" style={{ color: atColor(assetTurnover) }}>
              {assetTurnover.toFixed(2)}×
            </div>
            <div className="ratio-tile-bench">Efficient &gt; 1.0×</div>
          </div>
          <div className="ratio-tile">
            <div className="ratio-tile-label">Capacity Util %</div>
            <div className="ratio-tile-value" style={{ color: cuColor(capUtilPct) }}>
              {capUtilPct.toFixed(0)}%
            </div>
            <div className="ratio-tile-bench">Optimal 70–90%</div>
          </div>
          <div className="ratio-tile">
            <div className="ratio-tile-label">EPS</div>
            <div className="ratio-tile-value" style={{ color: eps >= 0 ? '#15803D' : '#DC2626' }}>
              {eps.toFixed(4)}p
            </div>
            <div className="ratio-tile-bench">Target &gt; 0.05p</div>
          </div>
        </div>

        {/* C2. Balance Sheet & Efficiency Ratios */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="ratio-tile">
            <div className="ratio-tile-label">Current Ratio</div>
            <div className="ratio-tile-value" style={{ color: currentRatio === null ? '#64748B' : currentRatio >= 1.5 ? '#15803D' : currentRatio >= 1 ? '#B45309' : '#DC2626' }}>
              {currentRatio !== null ? currentRatio.toFixed(2) : 'N/A'}
            </div>
            <div className="ratio-tile-bench">Target ≥ 1.5</div>
          </div>
          <div className="ratio-tile">
            <div className="ratio-tile-label">ROCE %</div>
            <div className="ratio-tile-value" style={{ color: roce >= 15 ? '#15803D' : roce >= 5 ? '#B45309' : '#DC2626' }}>
              {roce.toFixed(1)}%
            </div>
            <div className="ratio-tile-bench">Target ≥ 15%</div>
          </div>
          <div className="ratio-tile">
            <div className="ratio-tile-label">Working Capital</div>
            <div className="ratio-tile-value" style={{ color: workingCapital >= 0 ? '#15803D' : '#DC2626' }}>
              {workingCapital >= 0 ? '' : '-'}&pound;{fmt(Math.abs(workingCapital))}
            </div>
            <div className="ratio-tile-bench">Positive required</div>
          </div>
          <div className="ratio-tile">
            <div className="ratio-tile-label">P/E Ratio</div>
            <div className="ratio-tile-value" style={{ color: peRatio !== null && peRatio > 0 ? '#6366F1' : '#64748B' }}>
              {peRatio !== null && peRatio > 0 ? peRatio.toFixed(1) + '×' : 'N/A'}
            </div>
            <div className="ratio-tile-bench">Higher = growth signal</div>
          </div>
        </div>
        </>
      )}
      {chartData.length > 0 && (
        <div className="d-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Performance Trend</span>
            {quarters.length >= 2 && (
              <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                {quarters[0].year} Q{quarters[0].quarter} → {quarters[quarters.length - 1].year} Q{quarters[quarters.length - 1].quarter}
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
              <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
              <Tooltip {...DARK_TOOLTIP} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748B' }} />
              <Line yAxisId="left" type="monotone" dataKey="sharePrice" stroke="#6366F1" strokeWidth={2} dot={false} name="Share Price (p)" />
              <Line yAxisId="right" type="monotone" dataKey="netProfit" stroke="#15803D" strokeWidth={2} dot={false} name="Net Profit (£k)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* D2. Profitability Structure BarChart */}
      {chartData.length > 0 && (
        <div className="d-card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Profitability Structure (£k)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} unit="k" />
              <Tooltip {...DARK_TOOLTIP} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748B' }} />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue (£k)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="grossProfit" fill="#6366F1" name="Gross Profit (£k)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="netProfit" fill="#15803D" name="Net Profit (£k)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="d-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Quarter History</span>
          <span className="badge badge-indigo">{quarters.length} quarter{quarters.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>Loading...</div>
        ) : quarters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
            <TrendingUp size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>No quarters yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Submit your first decision to begin</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Quarter</th>
                  <th>Share Price</th>
                  <th>Revenue</th>
                  <th>Gross Margin %</th>
                  <th>Net Profit</th>
                  <th>Net Assets</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quarters.map((q) => {
                  const sr = Number(q.results?.profitAndLoss?.salesRevenue || 0);
                  const gp = Number(q.results?.profitAndLoss?.grossProfit || 0);
                  const gm = sr > 0 ? (gp / sr * 100) : 0;
                  const np = Number(q.results?.profitAndLoss?.netProfit || 0);
                  return (
                    <tr key={`${q.year}-${q.quarter}`} onClick={() => onNavigate('report', q)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 500 }}>{q.year}</td>
                      <td>Q{q.quarter}</td>
                      <td style={{ color: '#6366F1' }}>{Number(q.results?.sharePrice || 0).toFixed(1)}p</td>
                      <td>£{fmt(sr)}</td>
                      <td className={gm >= 40 ? 'val-pos' : gm >= 20 ? 'val-warn' : 'val-neg'}>
                        {gm.toFixed(1)}%
                      </td>
                      <td className={np >= 0 ? 'val-pos' : 'val-neg'}>£{fmt(np)}</td>
                      <td>£{fmt(q.results?.balanceSheet?.netAssets)}</td>
                      <td>
                        <span className={`badge ${q.isProcessed ? 'badge-green' : 'badge-amber'}`}>
                          {q.isProcessed ? 'Processed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ color: '#6366F1', fontSize: 16 }}>→</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* F. Quick Guide */}
      <div className="d-card-sm">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>How It Works</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            'Enter whole numbers only — no fractions except wage rate',
            'Enter "0" for nil decisions — do not leave blank',
            'Q1 follows Q4 of the previous year',
            'Share price is the primary performance criterion',
            'Higher advertising increases market share via price elasticity',
            'Shift level 2 doubles capacity with a 25% wage premium',
          ].map((tip, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#64748B' }}>
              <span style={{ color: '#6366F1', flexShrink: 0 }}>—</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

