'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getQuarters } from '@/lib/api';
import { Download } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { exportElementToPdf } from '@/lib/pdf';

const fmt = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('en-GB');
};

export default function TreasuryLab({ groupNumber, companyNumber }) {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [debtorImprove, setDebtorImprove] = useState(8);
  const [stockImprove, setStockImprove] = useState(6);
  const [creditorExtend, setCreditorExtend] = useState(7);
  const treasuryRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getQuarters(groupNumber, companyNumber);
        setQuarters(data || []);
      } catch (e) {
        console.error('TreasuryLab load error:', e);
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
  const a = bs.assets || {};
  const l = bs.liabilities || {};

  const revenue = Number(pl.salesRevenue || 0);
  const cos = Number(pl.costOfSales || 0);
  const debtors = Number(a.debtors || 0);
  const stock = Number(a.stock || 0);
  const cash = Number(a.cash || 0);
  const creditors = Number(l.creditors || 0);
  const taxation = Number(l.taxation || 0);
  const dividends = Number(l.dividends || 0);

  const curAssets = debtors + stock + cash;
  const curLiab = creditors + taxation + dividends;
  const currentRatio = curLiab > 0 ? curAssets / curLiab : 0;

  const debtorDays = revenue > 0 ? (debtors / revenue) * 365 : 0;
  const stockDays = cos > 0 ? (stock / cos) * 365 : 0;
  const creditorDays = cos > 0 ? (creditors / cos) * 365 : 0;
  const ccc = debtorDays + stockDays - creditorDays;

  const releasedFromDebtors = revenue > 0 ? (debtorImprove / 365) * revenue : 0;
  const releasedFromStock = cos > 0 ? (stockImprove / 365) * cos : 0;
  const addedFromCreditors = cos > 0 ? (creditorExtend / 365) * cos : 0;
  const totalCashRelease = releasedFromDebtors + releasedFromStock + addedFromCreditors;

  const projectedCash = cash + totalCashRelease;
  const projectedCurAssets = debtors + stock + projectedCash;
  const projectedCurrentRatio = curLiab > 0 ? projectedCurAssets / curLiab : currentRatio;

  const data = useMemo(() => quarters.map((q) => {
    const rr = q.results || {};
    const ppl = rr.profitAndLoss || {};
    const bbs = rr.balanceSheet || {};
    const aa = bbs.assets || {};
    const ll = bbs.liabilities || {};

    const sr = Number(ppl.salesRevenue || 0);
    const cs = Number(ppl.costOfSales || 0);
    const db = Number(aa.debtors || 0);
    const st = Number(aa.stock || 0);
    const cr = Number(ll.creditors || 0);

    const dDays = sr > 0 ? (db / sr) * 365 : 0;
    const sDays = cs > 0 ? (st / cs) * 365 : 0;
    const cDays = cs > 0 ? (cr / cs) * 365 : 0;

    return {
      label: `Y${q.year}Q${q.quarter}`,
      ccc: parseFloat((dDays + sDays - cDays).toFixed(1)),
      cash: Math.round(Number(aa.cash || 0) / 1000),
      currentRatio: (() => {
        const ca = Number(aa.stock || 0) + Number(aa.debtors || 0) + Number(aa.cash || 0);
        const cl = Number(ll.creditors || 0) + Number(ll.taxation || 0) + Number(ll.dividends || 0);
        return cl > 0 ? parseFloat((ca / cl).toFixed(2)) : 0;
      })(),
    };
  }), [quarters]);

  const handleExportPdf = async () => {
    if (!treasuryRef.current || isExporting) return;
    try {
      setIsExporting(true);
      await exportElementToPdf(
        treasuryRef.current,
        `treasury-working-capital-g${groupNumber}-c${companyNumber}.pdf`
      );
    } catch (e) {
      console.error('Treasury PDF export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="d-card">Loading treasury analytics...</div>;

  if (!latest) {
    return (
      <div className="d-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 16, color: '#0F172A', marginBottom: 8 }}>No treasury data yet</div>
        <div style={{ color: '#64748B' }}>Submit a quarter to unlock working-capital simulations.</div>
      </div>
    );
  }

  return (
    <div ref={treasuryRef} style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#0F172A' }}>Treasury and Working Capital Lab</h1>
          <div className="mono" style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            Liquidity engineering tools for Year {latest.year} Q{latest.quarter}
          </div>
        </div>
        <button className="btn-ghost" onClick={handleExportPdf} disabled={isExporting}>
          <Download size={14} /> {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      <div className="grid-5" style={{ marginBottom: 20 }}>
        <div className="ratio-tile"><div className="ratio-tile-label">Debtor Days</div><div className="ratio-tile-value">{debtorDays.toFixed(1)}</div><div className="ratio-tile-bench">Target {'<='} 30</div></div>
        <div className="ratio-tile"><div className="ratio-tile-label">Stock Days</div><div className="ratio-tile-value">{stockDays.toFixed(1)}</div><div className="ratio-tile-bench">Target {'<='} 45</div></div>
        <div className="ratio-tile"><div className="ratio-tile-label">Creditor Days</div><div className="ratio-tile-value">{creditorDays.toFixed(1)}</div><div className="ratio-tile-bench">Target 30-60</div></div>
        <div className="ratio-tile"><div className="ratio-tile-label">Cash Conversion Cycle</div><div className={`ratio-tile-value ${ccc <= 45 ? 'val-pos' : ccc <= 80 ? 'val-warn' : 'val-neg'}`}>{ccc.toFixed(1)}</div><div className="ratio-tile-bench">Lower is better</div></div>
        <div className="ratio-tile"><div className="ratio-tile-label">Current Ratio</div><div className={`ratio-tile-value ${currentRatio >= 1.5 ? 'val-pos' : currentRatio >= 1 ? 'val-warn' : 'val-neg'}`}>{currentRatio.toFixed(2)}</div><div className="ratio-tile-bench">Target {'>='} 1.50</div></div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="d-card">
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Treasury Improvement Simulator</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label className="fl">Debtor Collection Improvement (days): {debtorImprove}</label>
              <input className="fi" type="range" min={0} max={45} value={debtorImprove} onChange={(e) => setDebtorImprove(Number(e.target.value))} />
            </div>
            <div>
              <label className="fl">Inventory Reduction (days): {stockImprove}</label>
              <input className="fi" type="range" min={0} max={45} value={stockImprove} onChange={(e) => setStockImprove(Number(e.target.value))} />
            </div>
            <div>
              <label className="fl">Creditor Extension (days): {creditorExtend}</label>
              <input className="fi" type="range" min={0} max={45} value={creditorExtend} onChange={(e) => setCreditorExtend(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ marginTop: 14, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
            <div className="sc-row"><span className="report-label">Cash Released From Debtors</span><span className="report-value mono">&pound;{fmt(Math.round(releasedFromDebtors))}</span></div>
            <div className="sc-row"><span className="report-label">Cash Released From Inventory</span><span className="report-value mono">&pound;{fmt(Math.round(releasedFromStock))}</span></div>
            <div className="sc-row"><span className="report-label">Cash From Creditor Terms</span><span className="report-value mono">&pound;{fmt(Math.round(addedFromCreditors))}</span></div>
            <div className="sc-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
              <span className="report-label" style={{ fontWeight: 700 }}>Total Treasury Headroom</span>
              <span className="report-value mono val-pos" style={{ fontWeight: 700 }}>&pound;{fmt(Math.round(totalCashRelease))}</span>
            </div>
          </div>
        </div>

        <div className="d-card">
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Projected Liquidity Position</div>
          <div className="sc-row"><span className="report-label">Current Cash</span><span className="report-value mono">&pound;{fmt(cash)}</span></div>
          <div className="sc-row"><span className="report-label">Projected Cash</span><span className="report-value mono val-pos">&pound;{fmt(Math.round(projectedCash))}</span></div>
          <div className="sc-row"><span className="report-label">Current Ratio (Now)</span><span className="report-value mono">{currentRatio.toFixed(2)}</span></div>
          <div className="sc-row"><span className="report-label">Current Ratio (Projected)</span><span className={`report-value mono ${projectedCurrentRatio >= 1.5 ? 'val-pos' : projectedCurrentRatio >= 1 ? 'val-warn' : 'val-neg'}`}>{projectedCurrentRatio.toFixed(2)}</span></div>
          <div style={{ marginTop: 14, padding: 12, border: '1px solid #E2E8F0', borderRadius: 10, background: '#F8FAFC', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
            This model estimates liquidity gain from tighter receivables, lower inventory, and longer payables. It is a planning proxy, not a replacement for full cash flow forecasting.
          </div>
        </div>
      </div>

      <div className="d-card">
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Liquidity Trend Over Time</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine yAxisId="left" y={45} stroke="#15803D" strokeDasharray="4 4" label={{ value: 'CCC 45 target', fill: '#15803D', fontSize: 10 }} />
            <ReferenceLine yAxisId="right" y={1.5} stroke="#6366F1" strokeDasharray="4 4" label={{ value: 'CR 1.5 target', fill: '#6366F1', fontSize: 10 }} />
            <Line yAxisId="left" type="monotone" dataKey="ccc" stroke="#DC2626" strokeWidth={2} dot={{ fill: '#DC2626' }} name="Cash Conversion Cycle (days)" />
            <Line yAxisId="right" type="monotone" dataKey="currentRatio" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1' }} name="Current Ratio" />
            <Line yAxisId="left" type="monotone" dataKey="cash" stroke="#15803D" strokeWidth={2} dot={{ fill: '#15803D' }} name="Cash (£k)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
