'use client';

import { useState, useEffect } from 'react';
import { getQuarters } from '@/lib/api';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine,
} from 'recharts';

const fmt = (n) => {
  if (n === null || n === undefined) return '\u2014';
  return Number(n).toLocaleString('en-GB');
};
const fmtP = (n) => {
  if (n === null || n === undefined) return '\u2014';
  return Number(n).toFixed(1);
};

const SHARES = 2000000;

function darkTooltipStyle() {
  return {
    contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12 },
    labelStyle: { color: '#0F172A' },
    itemStyle: { color: '#475569' },
  };
}

export default function Analytics({ groupNumber, companyNumber, onNavigate }) {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qA, setQA] = useState(0);
  const [qB, setQB] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getQuarters(groupNumber, companyNumber);
        setQuarters(data || []);
      } catch (e) {
        console.error('Analytics load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupNumber, companyNumber]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
      <div className="mono" style={{ color: '#64748B' }}>Loading analytics...</div>
    </div>
  );

  if (!quarters.length) return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
      <div style={{ fontSize: 16, marginBottom: 8 }}>No quarterly data available</div>
      <div style={{ fontSize: 13 }}>Submit at least one quarter to see analytics</div>
    </div>
  );

  /* ── chart data ── */
  const chartData = quarters.map((q, idx) => {
    const r = q.results || {};
    const pl = r.profitAndLoss || {};
    const salesRevenue = Number(pl.salesRevenue || 0);
    const grossProfit = Number(pl.grossProfit || 0);
    const netProfit = Number(pl.netProfit || 0);
    const netAssets = Number(r.balanceSheet?.netAssets || r.balanceSheet?.totalNetAssets || 0);
    const costOfSales = Number(pl.costOfSales || 0);
    const totalOverheads = Number(pl.totalOverheads || 0);
    const grossMargin = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;
    const netMargin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0;
    const assetTurn = netAssets > 0 ? salesRevenue / netAssets : 0;
    const sharePrice = Number(r.sharePrice || 0);
    const eps = netProfit / SHARES;

    const totalSalespeople = Object.values(r.salespeople || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    const revenuePerSP = totalSalespeople > 0 ? salesRevenue / totalSalespeople : 0;
    const awTotal = Number(r.assemblyWorkers?.total || r.assemblyHours?.workers || 0);
    const revenuePerEmployee = (totalSalespeople + awTotal) > 0 ? salesRevenue / (totalSalespeople + awTotal) : 0;

    const bsA = r.balanceSheet?.assets || {};
    const bsL = r.balanceSheet?.liabilities || {};
    const curAssets = Number(bsA.stock || 0) + Number(bsA.debtors || 0) + Number(bsA.cash || 0);
    const curLiab = Number(bsL.creditors || 0) + Number(bsL.taxation || 0) + Number(bsL.dividends || 0);
    const roce = netAssets > 0 ? parseFloat((netProfit / netAssets * 100).toFixed(1)) : 0;
    const currentRatio = curLiab > 0 ? parseFloat((curAssets / curLiab).toFixed(2)) : null;
    const workingCapital = Math.round((curAssets - curLiab) / 1000);
    const overheadRatio = salesRevenue > 0 ? parseFloat((totalOverheads / salesRevenue * 100).toFixed(1)) : 0;

    return {
      label: `Y${q.year}Q${q.quarter}`,
      quarter: idx + 1,
      salesRevenue: Math.round(salesRevenue / 1000),
      costOfSales: Math.round(costOfSales / 1000),
      totalOverheads: Math.round(totalOverheads / 1000),
      grossProfit: Math.round(grossProfit / 1000),
      netProfit: Math.round(netProfit / 1000),
      netAssets: Math.round(netAssets / 1000),
      grossMargin: parseFloat(grossMargin.toFixed(1)),
      netMargin: parseFloat(netMargin.toFixed(1)),
      assetTurn: parseFloat(assetTurn.toFixed(2)),
      sharePrice: parseFloat(sharePrice.toFixed(1)),
      eps: parseFloat((eps * 100).toFixed(2)),
      totalSalespeople,
      revenuePerSP: Math.round(revenuePerSP),
      awTotal,
      revenuePerEmployee: Math.round(revenuePerEmployee),
      roce,
      currentRatio,
      workingCapital,
      overheadRatio,
    };
  });

  /* ── comparison ── */
  const qAData = chartData[qA];
  const qBData = chartData[qB];

  const compareMetrics = [
    { label: 'Share Price (p)', key: 'sharePrice', unit: 'p', higherBetter: true },
    { label: 'Revenue (\u00a3k)', key: 'salesRevenue', unit: 'k', higherBetter: true },
    { label: 'Gross Profit (\u00a3k)', key: 'grossProfit', unit: 'k', higherBetter: true },
    { label: 'Net Profit (\u00a3k)', key: 'netProfit', unit: 'k', higherBetter: true },
    { label: 'Gross Margin %', key: 'grossMargin', unit: '%', higherBetter: true },
    { label: 'Net Margin %', key: 'netMargin', unit: '%', higherBetter: true },
    { label: 'EPS (p)', key: 'eps', unit: 'p', higherBetter: true },
    { label: 'Net Assets (\u00a3k)', key: 'netAssets', unit: 'k', higherBetter: true },
    { label: 'Salespeople', key: 'totalSalespeople', unit: '', higherBetter: false },
    { label: 'Assembly Workers', key: 'awTotal', unit: '', higherBetter: false },
    { label: 'ROCE %', key: 'roce', unit: '%', higherBetter: true },
    { label: 'Current Ratio', key: 'currentRatio', unit: '×', higherBetter: true },
    { label: 'Overhead Ratio %', key: 'overheadRatio', unit: '%', higherBetter: false },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 }}>Analytics</h1>
        <div className="mono" style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
          Multi-quarter performance analysis &mdash; Group {groupNumber} &middot; Company {companyNumber}
        </div>
      </div>

      {/* ── A: Key Ratios LineChart ── */}
      <div className="d-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Key Ratios by Quarter</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} {...darkTooltipStyle()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 11 }} unit="%" />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 11 }} />
            <Tooltip {...darkTooltipStyle()} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#475569' }} />
            <ReferenceLine yAxisId="left" y={40} stroke="#15803D" strokeDasharray="4 4" label={{ value: '40% GM target', fill: '#15803D', fontSize: 10 }} />
            <ReferenceLine yAxisId="left" y={10} stroke="#B45309" strokeDasharray="4 4" label={{ value: '10% NM target', fill: '#B45309', fontSize: 10 }} />
            <Line yAxisId="left" type="monotone" dataKey="grossMargin" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1' }} name="Gross Margin %" />
            <Line yAxisId="left" type="monotone" dataKey="netMargin" stroke="#15803D" strokeWidth={2} dot={{ fill: '#15803D' }} name="Net Margin %" />
            <Line yAxisId="right" type="monotone" dataKey="assetTurn" stroke="#B45309" strokeWidth={2} dot={{ fill: '#B45309' }} name="Asset Turnover" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── B: Revenue vs Cost BarChart ── */}
      <div className="d-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Revenue vs Cost Structure (\u00a3k)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} {...darkTooltipStyle()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} unit="k" />
            <Tooltip {...darkTooltipStyle()} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#475569' }} />
            <Bar dataKey="salesRevenue" fill="#3B82F6" name="Revenue (\u00a3k)" />
            <Bar dataKey="costOfSales" fill="#DC2626" name="Cost of Sales (\u00a3k)" />
            <Bar dataKey="totalOverheads" fill="#B45309" name="Overheads (\u00a3k)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── B2: ROCE & Overhead Ratio ── */}
      <div className="d-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>ROCE % &amp; Overhead Ratio by Quarter</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} {...darkTooltipStyle()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 11 }} unit="%" />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 11 }} unit="×" />
            <Tooltip {...darkTooltipStyle()} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#475569' }} />
            <ReferenceLine yAxisId="left" y={15} stroke="#15803D" strokeDasharray="4 4" label={{ value: '15% ROCE target', fill: '#15803D', fontSize: 10 }} />
            <ReferenceLine yAxisId="left" y={40} stroke="#DC2626" strokeDasharray="4 4" label={{ value: '40% OH limit', fill: '#DC2626', fontSize: 10 }} />
            <Line yAxisId="left" type="monotone" dataKey="roce" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1' }} name="ROCE %" />
            <Line yAxisId="left" type="monotone" dataKey="overheadRatio" stroke="#DC2626" strokeWidth={2} dot={{ fill: '#DC2626' }} name="Overhead Ratio %" />
            <Line yAxisId="right" type="monotone" dataKey="currentRatio" stroke="#15803D" strokeWidth={2} dot={{ fill: '#15803D' }} name="Current Ratio (×)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── B3: EPS & Working Capital ── */}
      <div className="d-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>EPS (p) &amp; Working Capital (£k) by Quarter</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} {...darkTooltipStyle()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 11 }} unit="p" />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 11 }} unit="k" />
            <Tooltip {...darkTooltipStyle()} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#475569' }} />
            <ReferenceLine yAxisId="left" y={5} stroke="#15803D" strokeDasharray="4 4" label={{ value: '5p EPS target', fill: '#15803D', fontSize: 10 }} />
            <Line yAxisId="left" type="monotone" dataKey="eps" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1' }} name="EPS (p)" />
            <Line yAxisId="right" type="monotone" dataKey="workingCapital" stroke="#B45309" strokeWidth={2} dot={{ fill: '#B45309' }} name="Working Capital (£k)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="d-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Share Price Trajectory (p)</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} {...darkTooltipStyle()}>
            <defs>
              <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} unit="p" />
            <Tooltip {...darkTooltipStyle()} />
            <ReferenceLine y={150} stroke="#15803D" strokeDasharray="4 4" label={{ value: '150p target', fill: '#15803D', fontSize: 10 }} />
            <ReferenceLine y={100} stroke="#B45309" strokeDasharray="4 4" label={{ value: '100p baseline', fill: '#B45309', fontSize: 10 }} />
            <Area type="monotone" dataKey="sharePrice" stroke="#6366F1" strokeWidth={2} fill="url(#spGrad)" name="Share Price (p)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── D: Personnel Efficiency Table ── */}
      <div className="d-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Personnel Efficiency</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="dt">
            <thead>
              <tr>
                <th>Quarter</th>
                <th>Salespeople</th>
                <th>Revenue / SP (\u00a3)</th>
                <th>Assembly Workers</th>
                <th>Revenue / Employee (\u00a3)</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => {
                const prev = chartData[i - 1];
                const spUp = prev && d.revenuePerSP > prev.revenuePerSP;
                const empUp = prev && d.revenuePerEmployee > prev.revenuePerEmployee;
                return (
                  <tr key={i}>
                    <td className="mono">{d.label}</td>
                    <td>{d.totalSalespeople}</td>
                    <td className={spUp ? 'val-pos' : ''}>{fmt(d.revenuePerSP)}{spUp ? ' \u2191' : ''}</td>
                    <td>{d.awTotal}</td>
                    <td className={empUp ? 'val-pos' : ''}>{fmt(d.revenuePerEmployee)}{empUp ? ' \u2191' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── E: Quarter Comparison ── */}
      <div className="d-card">
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Quarter Comparison</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div>
            <label className="fl">Quarter A</label>
            <select className="fi" value={qA} onChange={e => setQA(Number(e.target.value))}>
              {chartData.map((d, i) => <option key={i} value={i}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="fl">Quarter B</label>
            <select className="fi" value={qB} onChange={e => setQB(Number(e.target.value))}>
              {chartData.map((d, i) => <option key={i} value={i}>{d.label}</option>)}
            </select>
          </div>
        </div>
        {qAData && qBData && (
          <div style={{ overflowX: 'auto' }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>{qAData.label}</th>
                  <th>{qBData.label}</th>
                  <th>\u0394 Change</th>
                </tr>
              </thead>
              <tbody>
                {compareMetrics.map(m => {
                  const a = qAData[m.key] ?? 0;
                  const b = qBData[m.key] ?? 0;
                  const delta = b - a;
                  const improved = m.higherBetter ? delta > 0 : delta < 0;
                  const worsened = m.higherBetter ? delta < 0 : delta > 0;
                  return (
                    <tr key={m.key}>
                      <td>{m.label}</td>
                      <td className="mono">{fmtP(a)}{m.unit}</td>
                      <td className="mono">{fmtP(b)}{m.unit}</td>
                      <td className={`mono ${improved ? 'val-pos' : worsened ? 'val-neg' : ''}`}>
                        {delta > 0 ? '+' : ''}{fmtP(delta)}{m.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}