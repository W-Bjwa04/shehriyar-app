'use client';

import { useRef, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf';

const fmt = (n) => {
  if (n === null || n === undefined) return '\u2014';
  return Number(n).toLocaleString('en-GB');
};
const fmtP = (n) => {
  if (n === null || n === undefined) return '\u2014';
  return Number(n).toFixed(1);
};

function Row({ label, value, bold = false, indent = 0, negative = false }) {
  const negVal = negative || (typeof value === 'number' && value < 0);
  return (
    <div className="sc-row" style={{ paddingLeft: `${indent * 16}px`, fontWeight: bold ? 600 : 400 }}>
      <span className="report-label">{label}</span>
      <span className={`report-value${negVal ? ' val-neg' : ''}`}>{typeof value === 'number' ? fmt(value) : value}</span>
    </div>
  );
}

const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'decisions',    label: 'Decisions' },
  { id: 'resources',    label: 'Resources' },
  { id: 'products',     label: 'Products' },
  { id: 'accounts',     label: 'Accounts' },
  { id: 'balance',      label: 'Balance Sheet' },
  { id: 'personnel',    label: 'Personnel' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'ratios',       label: 'Ratios' },
];

export default function ManagementReport({ data, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>No report available</div>
        <div style={{ fontSize: 13 }}>Submit decisions to generate a management report</div>
      </div>
    );
  }

  const { decisions: dec, results: r, year, quarter, groupNumber, companyNumber, numProducts } = data;
  const areas = ['export', 'south', 'west', 'north'];
  const areaLabels = { export: 'Export', south: 'South', west: 'West', north: 'North' };
  const prods = Array.from({ length: numProducts }, (_, i) => i);

  const pl = r?.profitAndLoss || {};
  const bs = r?.balanceSheet || {};
  const sharePrice = Number(r?.sharePrice || 0);
  const netProfit = Number(pl.netProfit || 0);
  const grossProfit = Number(pl.grossProfit || 0);
  const salesRevenue = Number(pl.salesRevenue || 0);
  const costOfSales = Number(pl.costOfSales || 0);
  const totalOverheads = Number(pl.totalOverheads || 0);
  const netAssets = Number(bs.netAssets || bs.totalNetAssets || 0);
  const grossMarginPct = salesRevenue > 0 ? ((grossProfit / salesRevenue) * 100) : 0;
  const netMarginPct = salesRevenue > 0 ? ((netProfit / salesRevenue) * 100) : 0;
  const SHARES = 2000000;
  const eps = netProfit / SHARES;
  const pe = eps > 0 ? (sharePrice / (eps * 100)) : null;

  const bsAssets = bs.assets || {};
  const bsLiab = bs.liabilities || {};
  const currentAssets = Number(bsAssets.currentAssets || bsAssets.stock || 0) +
                        Number(bsAssets.debtors || 0) + Number(bsAssets.cash || 0);
  const currentLiabilities = Number(bsLiab.creditors || 0) +
                              Number(bsLiab.taxation || 0) + Number(bsLiab.dividends || 0);
  const workingCapital = currentAssets - currentLiabilities;

  // Extended ratio computations
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : null;
  const quickRatio = currentLiabilities > 0 ? (currentAssets - Number(bsAssets.stock || 0)) / currentLiabilities : null;
  const assetTurnover = netAssets > 0 ? salesRevenue / netAssets : 0;
  const roce = netAssets > 0 ? (netProfit / netAssets) * 100 : 0;
  const totalLoans = Number(bsLiab.loans || bsLiab.longTermLoans || 0);
  const capitalEmployed = netAssets + totalLoans;
  const gearing = capitalEmployed > 0 ? (totalLoans / capitalEmployed) * 100 : 0;
  const debtorDays = salesRevenue > 0 ? (Number(bsAssets.debtors || 0) / salesRevenue * 365) : 0;
  const stockDays = costOfSales > 0 ? (Number(bsAssets.stock || 0) / costOfSales * 365) : 0;
  const creditorDays = costOfSales > 0 ? (Number(bsLiab.creditors || 0) / costOfSales * 365) : 0;
  const overheadRatio = salesRevenue > 0 ? (totalOverheads / salesRevenue) * 100 : 0;
  const ebitda = netProfit + Number(r?.overheads?.depreciation || r?.overheads?.Depreciation || 0);
  const totalSP = Object.values(r?.salespeople || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const awTotalR = Number(r?.assemblyWorkers?.total || 0);
  const totalEmp = totalSP + awTotalR;
  const revenuePerEmp = totalEmp > 0 ? salesRevenue / totalEmp : 0;
  const hoursUsedR = Number(r?.assemblyHours?.worked || r?.assemblyHours?.used || 0);
  const hoursAvailR = Number(r?.assemblyHours?.available || 0);
  const capUtilR = hoursAvailR > 0 ? (hoursUsedR / hoursAvailR) * 100 : 0;
  const dividendRate = Number(dec?.dividendRate || 0);
  const dividendYield = sharePrice > 0 ? (dividendRate / sharePrice) * 100 : 0;
  const ohEntries = Object.entries(oh).filter(([, v]) => typeof v === 'number' && v > 0);
  const ohTotal = ohEntries.reduce((s, [, v]) => s + v, 0);

  const handlePrint = () => window.print();
  const handleExportPdf = async () => {
    if (!reportRef.current || isExporting) return;
    try {
      setIsExporting(true);
      await exportElementToPdf(
        reportRef.current,
        `management-report-g${groupNumber}-c${companyNumber}-y${year}-q${quarter}.pdf`
      );
    } catch (e) {
      console.error('Management report PDF export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={reportRef} style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 }}>Management Report</h1>
          <div className="mono" style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            Group {groupNumber} &middot; Company {companyNumber} &middot; Year {year} Q{quarter}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={handleExportPdf} disabled={isExporting}>
            <Download size={14} /> {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button className="btn-ghost" onClick={handlePrint}>
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className="r-tabs" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} className={`r-tab${activeTab === t.id ? ' r-tab-active' : ''}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div className="stat-tile" style={{ borderColor: sharePrice >= 150 ? '#15803D' : sharePrice >= 100 ? '#6366F1' : '#B45309' }}>
              <div className="stat-tile-label">Share Price</div>
              <div className="stat-tile-value mono" style={{ color: sharePrice >= 150 ? '#15803D' : sharePrice >= 100 ? '#6366F1' : '#B45309', fontSize: 36 }}>
                {fmtP(sharePrice)}p
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                {sharePrice >= 150 ? '\u2713 Above target (150p)' : sharePrice >= 100 ? '\u2014 Above baseline (100p)' : '\u26a0 Below baseline (100p)'}
              </div>
            </div>
            <div className="d-card-sm">
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>P&amp;L Summary</div>
              <Row label="Revenue" value={salesRevenue} />
              <Row label="Cost of Sales" value={costOfSales} negative />
              <Row label="Gross Profit" value={grossProfit} bold />
              <Row label="Total Overheads" value={totalOverheads} negative />
              <Row label="Net Profit" value={netProfit} bold />
              <div style={{ marginTop: 8, fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                GM: {fmtP(grossMarginPct)}% &middot; NM: {fmtP(netMarginPct)}%
              </div>
            </div>
            <div className="d-card-sm">
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Key Ratios</div>
              <div className="sc-row">
                <span className="report-label">Gross Margin %</span>
                <span className={`report-value mono ${grossMarginPct >= 40 ? 'val-pos' : grossMarginPct >= 25 ? '' : 'val-neg'}`}>{fmtP(grossMarginPct)}%</span>
              </div>
              <div className="sc-row">
                <span className="report-label">Net Margin %</span>
                <span className={`report-value mono ${netMarginPct >= 10 ? 'val-pos' : netMarginPct >= 0 ? '' : 'val-neg'}`}>{fmtP(netMarginPct)}%</span>
              </div>
              <div className="sc-row">
                <span className="report-label">EPS</span>
                <span className={`report-value mono ${eps > 0 ? 'val-pos' : 'val-neg'}`}>{(eps * 100).toFixed(2)}p</span>
              </div>
              {pe !== null && (
                <div className="sc-row">
                  <span className="report-label">P/E Ratio</span>
                  <span className="report-value mono">{pe.toFixed(1)}&times;</span>
                </div>
              )}
              <div className="sc-row">
                <span className="report-label">Net Assets</span>
                <span className="report-value mono">&pound;{fmt(netAssets)}</span>
              </div>
            </div>
          </div>
          {netMarginPct >= 10 && sharePrice >= 100 ? (
            <div className="alert-info">
              <span>&check;</span>
              <span>Strong performance &mdash; net margin above 10% and share price above the 100p baseline.</span>
            </div>
          ) : netMarginPct < 0 || sharePrice < 100 ? (
            <div className="alert-warn">
              <span>&there4;</span>
              <span>
                {netMarginPct < 0 ? 'Net profit is negative \u2014 review overhead structure and pricing strategy. ' : ''}
                {sharePrice < 100 ? 'Share price is below the 100p baseline \u2014 consider dividend policy and profitability improvements.' : ''}
              </span>
            </div>
          ) : (
            <div className="alert-info">
              <span>&#x2139;</span>
              <span>Acceptable performance. Gross margin {fmtP(grossMarginPct)}% \u2014 target 40%+ for sustained growth.</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'decisions' && (
        <div>
          <div className="d-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Product Decisions &mdash; Q{quarter} {year}</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="dt">
                <thead><tr><th></th>{prods.map(i => <th key={i}>P{i + 1}</th>)}</tr></thead>
                <tbody>
                  <tr><td>Export Price (&pound;)</td>{prods.map(i => <td key={i}>{fmt(dec?.prices?.export?.[i])}</td>)}</tr>
                  <tr><td>Home Price (&pound;)</td>{prods.map(i => <td key={i}>{fmt(dec?.prices?.home?.[i])}</td>)}</tr>
                  <tr><td>Adv Trade Press (&pound;k)</td>{prods.map(i => <td key={i}>{fmt(dec?.advertising?.tradePress?.[i])}</td>)}</tr>
                  <tr><td>Adv Press/TV (&pound;k)</td>{prods.map(i => <td key={i}>{fmt(dec?.advertising?.pressTV?.[i])}</td>)}</tr>
                  <tr><td>Adv Merchandising (&pound;k)</td>{prods.map(i => <td key={i}>{fmt(dec?.advertising?.merchandising?.[i])}</td>)}</tr>
                  <tr><td>Assembly Time (min)</td>{prods.map(i => <td key={i}>{fmt(dec?.assemblyTime?.[i])}</td>)}</tr>
                  <tr><td>Research (&pound;k)</td>{prods.map(i => <td key={i}>{fmt(dec?.researchExpenditure?.[i])}</td>)}</tr>
                  <tr><td>Major Improvement</td>{prods.map(i => <td key={i}>{dec?.majorProductImprovement?.[i] ? '\u2713' : '\u2014'}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="d-card-sm">
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Salespeople</div>
              {areas.map(a => <Row key={a} label={areaLabels[a]} value={dec?.salespeople?.[a]} />)}
              <Row label="Quarterly Salary (&pound;'00)" value={dec?.salespeopleRemuneration?.quarterlySalary} />
              <Row label="Commission %" value={dec?.salespeopleRemuneration?.salesCommission} />
            </div>
            <div className="d-card-sm">
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Operations</div>
              <Row label="Assembly Wage Rate" value={dec?.assemblyWageRate} />
              <Row label="Shift Level" value={dec?.shiftLevel} />
              <Row label="Maintenance Hrs/Machine" value={dec?.maintenanceHours} />
              <Row label="Management Budget (&pound;k)" value={dec?.managementBudget} />
            </div>
            <div className="d-card-sm">
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Finance</div>
              <Row label="Dividend Rate %" value={dec?.dividendRate} />
              <Row label="Days Credit Allowed" value={dec?.daysCreditAllowed} />
              <Row label="Machines to Sell" value={dec?.machinesToSell} />
              <Row label="New Machines Ordered" value={dec?.newMachinesToOrder} />
              <Row label="Vans to Buy" value={dec?.vansToBuy} />
              <Row label="Vans to Sell" value={dec?.vansToSell} />
            </div>
            <div className="d-card-sm">
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Materials</div>
              <Row label="Units Ordered" value={dec?.materials?.unitsToOrder} />
              <Row label="Supplier No." value={dec?.materials?.supplierNo} />
              <Row label="Deliveries" value={dec?.materials?.numDeliveries} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="d-card">
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Machines</div>
            {r?.machines && Object.entries(r.machines).map(([k, v]) => (
              <Row key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} value={v} />
            ))}
          </div>
          <div className="d-card">
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Assembly Hours</div>
            {r?.assemblyHours && Object.entries(r.assemblyHours).map(([k, v]) => (
              <Row key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} value={v} />
            ))}
            {r?.materials && (
              <>
                <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Materials</div>
                {Object.entries(r.materials).map(([k, v]) => (
                  <Row key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} value={v} />
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="d-card">
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Product Movements</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="dt">
              <thead><tr><th>Region</th>{prods.map(i => <th key={i}>P{i + 1}</th>)}</tr></thead>
              <tbody>
                {areas.map(area => {
                  const areaData = r?.productMovements?.[area] || {};
                  return (
                    <tr key={area}>
                      <td style={{ fontWeight: 500 }}>{areaLabels[area]}</td>
                      {prods.map(i => (
                        <td key={i}>
                          <div>{fmt(areaData.unitsSold?.[i] || areaData[i]?.unitsSold)}</div>
                          <div style={{ fontSize: 10, color: '#64748B' }}>{fmt(areaData.revenue?.[i] || areaData[i]?.revenue)}</div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="d-card">
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Profit &amp; Loss Statement</div>
            <Row label="Sales Revenue" value={salesRevenue} bold />
            <Row label="Cost of Sales" value={costOfSales} negative />
            <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }} />
            <Row label="Gross Profit" value={grossProfit} bold />
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
              Gross Margin: {fmtP(grossMarginPct)}%
            </div>
            <Row label="Total Overheads" value={totalOverheads} negative />
            <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }} />
            <div style={{
              padding: '8px 12px', borderRadius: 6, marginTop: 4,
              background: netProfit >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${netProfit >= 0 ? '#15803D' : '#DC2626'}30`
            }}>
              <div className="sc-row" style={{ fontWeight: 600 }}>
                <span className="report-label">Net Profit</span>
                <span className={`report-value mono ${netProfit >= 0 ? 'val-pos' : 'val-neg'}`}>&pound;{fmt(netProfit)}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                Net Margin: {fmtP(netMarginPct)}%
              </div>
            </div>
          </div>
          <div className="d-card">
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Overhead Breakdown</div>
            {ohEntries.length > 0 ? ohEntries.map(([key, val]) => {
              const pct = ohTotal > 0 ? (val / ohTotal) * 100 : 0;
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: '#475569' }}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</span>
                    <span className="mono" style={{ color: '#0F172A' }}>&pound;{fmt(val)}</span>
                  </div>
                  <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#6366F1', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{fmtP(pct)}%</div>
                </div>
              );
            }) : <div style={{ color: '#64748B', fontSize: 13 }}>No overhead breakdown data</div>}
            {ohTotal > 0 && (
              <div className="sc-row" style={{ marginTop: 12, fontWeight: 600, borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                <span className="report-label">Total Overheads</span>
                <span className="report-value mono">&pound;{fmt(ohTotal)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'balance' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="d-card">
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Balance Sheet</div>
              {bs.assets && Object.entries(bs.assets).map(([k, v]) => (
                typeof v === 'number' ? <Row key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} value={v} /> : null
              ))}
              {bs.liabilities && (
                <>
                  <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }} />
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Liabilities</div>
                  {Object.entries(bs.liabilities).map(([k, v]) => (
                    typeof v === 'number' ? <Row key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} value={v} negative /> : null
                  ))}
                </>
              )}
              <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }} />
              <Row label="Net Assets" value={netAssets} bold />
            </div>
            <div className="d-card">
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Cash Flow</div>
              {r?.cashFlow ? Object.entries(r.cashFlow).map(([k, v]) => (
                typeof v === 'number' ? <Row key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} value={v} negative={v < 0} /> : null
              )) : <div style={{ color: '#64748B', fontSize: 13 }}>No cash flow data</div>}
            </div>
          </div>
          <div className="d-card-sm" style={{ border: `1px solid ${workingCapital >= 0 ? '#15803D' : '#DC2626'}40` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Working Capital</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Current Assets &minus; Current Liabilities</div>
                <div className="mono" style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                  &pound;{fmt(currentAssets)} &minus; &pound;{fmt(currentLiabilities)}
                </div>
              </div>
              <div>
                <div className={`mono ${workingCapital >= 0 ? 'val-pos' : 'val-neg'}`} style={{ fontSize: 28, fontWeight: 700 }}>
                  &pound;{fmt(workingCapital)}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', textAlign: 'right' }}>
                  {workingCapital >= 0 ? 'Positive \u2014 solvent' : 'Negative \u2014 liquidity risk'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'personnel' && (
        <div>
          <div className="d-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Personnel Overview</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="dt">
                <thead>
                  <tr><th>Region</th><th>Salespeople</th><th>Recruited</th><th>Dismissed</th><th>Trained</th></tr>
                </thead>
                <tbody>
                  {areas.map(area => (
                    <tr key={area}>
                      <td>{areaLabels[area]}</td>
                      <td>{fmt(r?.salespeople?.[area])}</td>
                      <td>{fmt(dec?.personnel?.salespeople?.recruit)}</td>
                      <td>{fmt(dec?.personnel?.salespeople?.dismiss)}</td>
                      <td>{fmt(dec?.personnel?.salespeople?.train)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="d-card-sm">
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Personnel Cost Summary</div>
            {r?.personnelCosts && Object.entries(r.personnelCosts).map(([k, v]) => (
              typeof v === 'number' ? <Row key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} value={v} /> : null
            ))}
            <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }} />
            <div style={{ fontSize: 12, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
              Assembly Workers: Recruit {dec?.personnel?.assemblyWorkers?.recruit || 0} &middot;
              Dismiss {dec?.personnel?.assemblyWorkers?.dismiss || 0} &middot;
              Train {dec?.personnel?.assemblyWorkers?.train || 0}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'intelligence' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="d-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Share Price</div>
              <div className="mono" style={{
                fontSize: 56, fontWeight: 700, lineHeight: 1,
                color: sharePrice >= 150 ? '#15803D' : sharePrice >= 100 ? '#6366F1' : '#B45309'
              }}>
                {fmtP(sharePrice)}p
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#64748B' }}>
                {sharePrice >= 150 ? 'Target achieved (\u2265 150p)' : sharePrice >= 100 ? 'Above baseline (100p)' : 'Below baseline \u2014 action required'}
              </div>
              <div style={{ height: 1, background: '#F1F5F9', margin: '16px 0' }} />
              <div className="sc-row">
                <span className="report-label">EPS</span>
                <span className={`report-value mono ${eps > 0 ? 'val-pos' : 'val-neg'}`}>{(eps * 100).toFixed(2)}p</span>
              </div>
              {pe !== null && (
                <div className="sc-row">
                  <span className="report-label">P/E Ratio</span>
                  <span className="report-value mono">{pe.toFixed(1)}&times;</span>
                </div>
              )}
              <div className="sc-row">
                <span className="report-label">Net Profit</span>
                <span className={`report-value mono ${netProfit >= 0 ? 'val-pos' : 'val-neg'}`}>&pound;{fmt(netProfit)}</span>
              </div>
            </div>
            <div className="d-card">
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Economic Conditions</div>
              {r?.economic ? Object.entries(r.economic).map(([k, v]) => (
                <div key={k} className="sc-row">
                  <span className="report-label">{k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</span>
                  <span className="report-value mono">{typeof v === 'number' ? fmtP(v) : String(v)}</span>
                </div>
              )) : <div style={{ color: '#64748B', fontSize: 13 }}>No economic data available</div>}
              {r?.businessIntelligence && (
                <>
                  <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Business Intelligence</div>
                  {r.businessIntelligence.companyInfo && (
                    <div className="d-card-sm" style={{ background: '#F1F5F9', marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>Company Information</div>
                      {Object.entries(r.businessIntelligence.companyInfo).map(([k, v]) => (
                        <div key={k} className="sc-row">
                          <span className="report-label" style={{ fontSize: 11 }}>{k}</span>
                          <span className="report-value mono" style={{ fontSize: 11 }}>{typeof v === 'number' ? fmt(v) : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.businessIntelligence.marketShares && (
                    <div className="d-card-sm" style={{ background: '#F1F5F9' }}>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>Market Shares</div>
                      {Object.entries(r.businessIntelligence.marketShares).map(([k, v]) => (
                        <div key={k} className="sc-row">
                          <span className="report-label" style={{ fontSize: 11 }}>{k}</span>
                          <span className="report-value mono" style={{ fontSize: 11 }}>{typeof v === 'number' ? fmtP(v) + '%' : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RATIOS TAB ── */}
      {activeTab === 'ratios' && (
        <div>
          {/* Profitability Ratios */}
          <div className="d-card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', marginBottom: 14 }}>Profitability Ratios</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="dt">
                <thead>
                  <tr>
                    <th>Ratio</th><th>Value</th><th>Benchmark</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Gross Margin %',  val: grossMarginPct.toFixed(1) + '%', bench: '≥ 40%',  ok: grossMarginPct >= 40, warn: grossMarginPct >= 25 },
                    { label: 'Net Margin %',    val: netMarginPct.toFixed(1) + '%',   bench: '≥ 10%',  ok: netMarginPct >= 10,   warn: netMarginPct >= 5 },
                    { label: 'ROCE %',          val: roce.toFixed(1) + '%',           bench: '≥ 15%',  ok: roce >= 15,           warn: roce >= 5 },
                    { label: 'EBITDA (£)',      val: fmt(ebitda),                     bench: '> 0',     ok: ebitda > 0,           warn: ebitda > -10000 },
                    { label: 'EPS (p)',         val: (eps * 100).toFixed(3) + 'p',    bench: '≥ 5p',   ok: eps * 100 >= 5,       warn: eps > 0 },
                    { label: 'P/E Ratio',       val: pe !== null ? pe.toFixed(1) + '×' : 'N/A', bench: '10–25×', ok: pe !== null && pe >= 10 && pe <= 30, warn: pe !== null && pe > 0 },
                  ].map(row => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className={`mono ${row.ok ? 'val-pos' : row.warn ? 'val-warn' : 'val-neg'}`}>{row.val}</td>
                      <td style={{ fontSize: 11, color: '#64748B' }}>{row.bench}</td>
                      <td><span className={`badge ${row.ok ? 'badge-green' : row.warn ? 'badge-amber' : 'badge-red'}`}>{row.ok ? 'On Track' : row.warn ? 'Monitor' : 'Below Target'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Liquidity Ratios */}
          <div className="d-card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', marginBottom: 14 }}>Liquidity Ratios</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="dt">
                <thead>
                  <tr>
                    <th>Ratio</th><th>Value</th><th>Benchmark</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Current Ratio',   val: currentRatio !== null ? currentRatio.toFixed(2) + '×' : 'N/A', bench: '≥ 1.5×', ok: currentRatio !== null && currentRatio >= 1.5, warn: currentRatio !== null && currentRatio >= 1 },
                    { label: 'Quick Ratio',     val: quickRatio !== null ? quickRatio.toFixed(2) + '×' : 'N/A',   bench: '≥ 1.0×', ok: quickRatio !== null && quickRatio >= 1,   warn: quickRatio !== null && quickRatio >= 0.75 },
                    { label: 'Working Capital (£)', val: fmt(workingCapital), bench: '> 0',    ok: workingCapital > 0, warn: workingCapital >= -5000 },
                    { label: 'Cash (£)',        val: fmt(Number(bsAssets.cash || 0)),           bench: '> 0',    ok: Number(bsAssets.cash || 0) > 0, warn: true },
                  ].map(row => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className={`mono ${row.ok ? 'val-pos' : row.warn ? 'val-warn' : 'val-neg'}`}>{row.val}</td>
                      <td style={{ fontSize: 11, color: '#64748B' }}>{row.bench}</td>
                      <td><span className={`badge ${row.ok ? 'badge-green' : row.warn ? 'badge-amber' : 'badge-red'}`}>{row.ok ? 'On Track' : row.warn ? 'Monitor' : 'Below Target'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Efficiency Ratios */}
          <div className="d-card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', marginBottom: 14 }}>Efficiency Ratios</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="dt">
                <thead>
                  <tr>
                    <th>Ratio</th><th>Value</th><th>Benchmark</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Asset Turnover',       val: assetTurnover.toFixed(2) + '×',     bench: '≥ 1.0×', ok: assetTurnover >= 1, warn: assetTurnover >= 0.7 },
                    { label: 'Overhead Ratio %',      val: overheadRatio.toFixed(1) + '%',    bench: '< 40%',  ok: overheadRatio < 40,  warn: overheadRatio < 55 },
                    { label: 'Debtor Days',           val: debtorDays.toFixed(0) + ' days',   bench: '≤ 30d',  ok: debtorDays <= 30,    warn: debtorDays <= 60 },
                    { label: 'Stock Days',            val: stockDays.toFixed(0) + ' days',    bench: '≤ 45d',  ok: stockDays <= 45,     warn: stockDays <= 90 },
                    { label: 'Creditor Days',         val: creditorDays.toFixed(0) + ' days', bench: '30–60d', ok: creditorDays >= 20 && creditorDays <= 60, warn: creditorDays < 90 },
                    { label: 'Revenue per Employee (£)', val: fmt(Math.round(revenuePerEmp)), bench: '> £5,000', ok: revenuePerEmp >= 5000, warn: revenuePerEmp >= 2000 },
                    { label: 'Capacity Utilisation %', val: capUtilR.toFixed(1) + '%',       bench: '70–90%', ok: capUtilR >= 70 && capUtilR <= 90, warn: capUtilR >= 50 },
                  ].map(row => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className={`mono ${row.ok ? 'val-pos' : row.warn ? 'val-warn' : 'val-neg'}`}>{row.val}</td>
                      <td style={{ fontSize: 11, color: '#64748B' }}>{row.bench}</td>
                      <td><span className={`badge ${row.ok ? 'badge-green' : row.warn ? 'badge-amber' : 'badge-red'}`}>{row.ok ? 'On Track' : row.warn ? 'Monitor' : 'Below Target'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gearing & Market Ratios */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="d-card">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', marginBottom: 14 }}>Capital Structure</div>
              {[
                { label: 'Net Assets (£)',     value: fmt(netAssets) },
                { label: 'Long-term Loans (£)', value: fmt(totalLoans) },
                { label: 'Capital Employed (£)', value: fmt(capitalEmployed) },
                { label: 'Gearing %',          value: gearing.toFixed(1) + '%' },
              ].map(row => (
                <div key={row.label} className="sc-row">
                  <span className="report-label">{row.label}</span>
                  <span className="report-value mono">{row.value}</span>
                </div>
              ))}
              <div className="sc-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                <span className="report-label" style={{ color: '#64748B', fontSize: 11 }}>Gearing Target</span>
                <span style={{ fontSize: 11, color: gearing <= 50 ? '#15803D' : '#DC2626' }}>
                  {gearing <= 50 ? 'Low risk (≤ 50%)' : 'High risk (> 50%)'}
                </span>
              </div>
            </div>
            <div className="d-card">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', marginBottom: 14 }}>Per-Share Metrics</div>
              {[
                { label: 'Share Price (p)',   value: sharePrice.toFixed(1) + 'p' },
                { label: 'EPS (p)',           value: (eps * 100).toFixed(3) + 'p' },
                { label: 'P/E Ratio',         value: pe !== null ? pe.toFixed(1) + '×' : 'N/A' },
                { label: 'Dividend Rate (p)', value: dividendRate.toFixed(1) + 'p' },
                { label: 'Dividend Yield %',  value: dividendYield.toFixed(2) + '%' },
                { label: 'Shares Issued',     value: fmt(SHARES) },
              ].map(row => (
                <div key={row.label} className="sc-row">
                  <span className="report-label">{row.label}</span>
                  <span className="report-value mono">{row.value}</span>
                </div>
              ))}
              <div className="sc-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                <span className="report-label" style={{ color: '#64748B', fontSize: 11 }}>vs Baseline</span>
                <span className={`mono ${sharePrice >= 150 ? 'val-pos' : sharePrice >= 100 ? 'val-warn' : 'val-neg'}`} style={{ fontSize: 11 }}>
                  {sharePrice >= 150 ? '✓ Above 150p target' : sharePrice >= 100 ? '~ At 100p baseline' : '✗ Below 100p baseline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}