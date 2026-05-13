'use client';

import { useEffect, useState } from 'react';
import { getDefaults, submitDecisions } from '@/lib/api';
import { toast } from 'react-toastify';

const NUM_PRODUCTS = 3;

function n(v) {
  if (v === '' || v === null || v === undefined) return 0;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function TopazClassicForm({ groupNumber: propGroup, companyNumber: propCompany, onSubmitSuccess }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    simulationCode: '',
    year: 2006,
    quarter: 4,
    groupNumber: propGroup || 1,
    companyNumber: propCompany || 1,
    identityNumber: '',
    status: 2,
    numProducts: NUM_PRODUCTS,

    majorProductImprovement: [false, false, false],
    pricesExport: [0, 0, 0],
    pricesHome: [0, 0, 0],
    advTradePress: [0, 0, 0],
    advPressTV: [0, 0, 0],
    advMerchandising: [0, 0, 0],

    assemblyTime: [120, 120, 120],
    deliveryExport: [0, 0, 0],
    deliverySouth: [0, 0, 0],
    deliveryWest: [0, 0, 0],
    deliveryNorth: [0, 0, 0],
    researchExpenditure: [0, 0, 0],

    spExport: 0,
    spSouth: 0,
    spWest: 0,
    spNorth: 0,
    quarterlySalary: 0,
    salesCommission: 0,

    dividendRate: 0,
    daysCreditAllowed: 30,
    vansToBuy: 0,
    vansToSell: 0,
    infoOnCompanies: false,
    infoOnMarketShares: false,

    spRecruit: 0,
    spDismiss: 0,
    spTrain: 0,
    awRecruit: 0,
    awDismiss: 0,
    awTrain: 0,

    assemblyWageRate: 6.95,
    shiftLevel: 2,
    managementBudget: 0,
    maintenanceHours: 0,
    machinesToSell: 0,
    newMachinesToOrder: 0,

    materialsUnits: 0,
    materialsSupplier: 0,
    materialsDeliveries: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const gn = propGroup || 1;
        const cn = propCompany || 1;
        const { data } = await getDefaults(gn, cn, NUM_PRODUCTS);
        const d = data?.decisions || {};

        setForm((prev) => ({
          ...prev,
          groupNumber: gn,
          companyNumber: cn,
          year: data?.year || prev.year,
          quarter: data?.quarter || prev.quarter,

          majorProductImprovement: d.majorProductImprovement || prev.majorProductImprovement,
          pricesExport: d.prices?.export || prev.pricesExport,
          pricesHome: d.prices?.home || prev.pricesHome,
          advTradePress: d.advertising?.tradePress || prev.advTradePress,
          advPressTV: d.advertising?.pressTV || prev.advPressTV,
          advMerchandising: d.advertising?.merchandising || prev.advMerchandising,

          assemblyTime: d.assemblyTime || prev.assemblyTime,
          deliveryExport: d.deliverySchedule?.export || prev.deliveryExport,
          deliverySouth: d.deliverySchedule?.south || prev.deliverySouth,
          deliveryWest: d.deliverySchedule?.west || prev.deliveryWest,
          deliveryNorth: d.deliverySchedule?.north || prev.deliveryNorth,
          researchExpenditure: d.researchExpenditure || prev.researchExpenditure,

          spExport: d.salespeople?.export || prev.spExport,
          spSouth: d.salespeople?.south || prev.spSouth,
          spWest: d.salespeople?.west || prev.spWest,
          spNorth: d.salespeople?.north || prev.spNorth,
          quarterlySalary: d.salespeopleRemuneration?.quarterlySalary || prev.quarterlySalary,
          salesCommission: d.salespeopleRemuneration?.salesCommission || prev.salesCommission,

          dividendRate: d.dividendRate || prev.dividendRate,
          daysCreditAllowed: d.daysCreditAllowed || prev.daysCreditAllowed,
          vansToBuy: d.vansToBuy || prev.vansToBuy,
          vansToSell: d.vansToSell || prev.vansToSell,
          infoOnCompanies: !!d.infoOnCompanies,
          infoOnMarketShares: !!d.infoOnMarketShares,

          spRecruit: d.personnel?.salespeople?.recruit || prev.spRecruit,
          spDismiss: d.personnel?.salespeople?.dismiss || prev.spDismiss,
          spTrain: d.personnel?.salespeople?.train || prev.spTrain,
          awRecruit: d.personnel?.assemblyWorkers?.recruit || prev.awRecruit,
          awDismiss: d.personnel?.assemblyWorkers?.dismiss || prev.awDismiss,
          awTrain: d.personnel?.assemblyWorkers?.train || prev.awTrain,

          assemblyWageRate: d.assemblyWageRate || prev.assemblyWageRate,
          shiftLevel: d.shiftLevel || prev.shiftLevel,
          managementBudget: d.managementBudget || prev.managementBudget,
          maintenanceHours: d.maintenanceHours || prev.maintenanceHours,
          machinesToSell: d.machinesToSell || prev.machinesToSell,
          newMachinesToOrder: d.newMachinesToOrder || prev.newMachinesToOrder,

          materialsUnits: d.materials?.unitsToOrder || prev.materialsUnits,
          materialsSupplier: d.materials?.supplierNo || prev.materialsSupplier,
          materialsDeliveries: d.materials?.numDeliveries || prev.materialsDeliveries,
        }));
      } catch (e) {
        console.error('Topaz classic defaults load failed:', e);
        toast.error('Failed to load default sheet values');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [propGroup, propCompany]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setArr = (key, idx, value) => {
    setForm((prev) => {
      const next = [...prev[key]];
      next[idx] = value;
      return { ...prev, [key]: next };
    });
  };

  const buildPayload = () => ({
    simulationCode: form.simulationCode,
    groupNumber: n(form.groupNumber),
    companyNumber: n(form.companyNumber),
    identityNumber: form.identityNumber,
    year: n(form.year),
    quarter: n(form.quarter),
    status: n(form.status),
    numProducts: NUM_PRODUCTS,
    decisions: {
      majorProductImprovement: form.majorProductImprovement,
      prices: { export: form.pricesExport.map(n), home: form.pricesHome.map(n) },
      advertising: {
        tradePress: form.advTradePress.map(n),
        pressTV: form.advPressTV.map(n),
        merchandising: form.advMerchandising.map(n),
      },
      assemblyTime: form.assemblyTime.map(n),
      deliverySchedule: {
        export: form.deliveryExport.map(n),
        south: form.deliverySouth.map(n),
        west: form.deliveryWest.map(n),
        north: form.deliveryNorth.map(n),
      },
      researchExpenditure: form.researchExpenditure.map(n),
      salespeople: {
        export: n(form.spExport),
        south: n(form.spSouth),
        west: n(form.spWest),
        north: n(form.spNorth),
      },
      salespeopleRemuneration: {
        quarterlySalary: n(form.quarterlySalary),
        salesCommission: n(form.salesCommission),
      },
      assemblyWageRate: n(form.assemblyWageRate),
      shiftLevel: n(form.shiftLevel),
      maintenanceHours: n(form.maintenanceHours),
      managementBudget: n(form.managementBudget),
      dividendRate: n(form.dividendRate),
      daysCreditAllowed: n(form.daysCreditAllowed),
      machinesToSell: n(form.machinesToSell),
      newMachinesToOrder: n(form.newMachinesToOrder),
      vansToBuy: n(form.vansToBuy),
      vansToSell: n(form.vansToSell),
      infoOnCompanies: !!form.infoOnCompanies,
      infoOnMarketShares: !!form.infoOnMarketShares,
      personnel: {
        salespeople: {
          recruit: n(form.spRecruit),
          dismiss: n(form.spDismiss),
          train: n(form.spTrain),
        },
        assemblyWorkers: {
          recruit: n(form.awRecruit),
          dismiss: n(form.awDismiss),
          train: n(form.awTrain),
        },
      },
      materials: {
        unitsToOrder: n(form.materialsUnits),
        supplierNo: n(form.materialsSupplier),
        numDeliveries: n(form.materialsDeliveries),
      },
    },
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data } = await submitDecisions(buildPayload());
      toast.success(data?.message || 'Topaz classic sheet submitted');
      if (onSubmitSuccess) onSubmitSuccess(data.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to submit classic sheet');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="d-card">Loading Topaz classic sheet...</div>;
  }

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 10px 0', fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Topaz VBE Classic Decision Sheet</h1>
      <div className="mono" style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
        Win95-inspired interface linked to live backend processing
      </div>

      <form className="topaz95-shell" onSubmit={onSubmit}>
        <div className="topaz95-panel topaz95-blue">
          <div className="topaz95-title">Simulation Data</div>
          <div className="topaz95-row topaz95-row-4">
            <label>Simulation Code <input className="topaz95-input" value={form.simulationCode} onChange={(e) => setField('simulationCode', e.target.value)} /></label>
            <label>Year <input className="topaz95-input" type="number" value={form.year} onChange={(e) => setField('year', e.target.value)} /></label>
            <label>Quarter <input className="topaz95-input" type="number" min={1} max={4} value={form.quarter} onChange={(e) => setField('quarter', e.target.value)} /></label>
            <label>Status <input className="topaz95-input" type="number" value={form.status} onChange={(e) => setField('status', e.target.value)} /></label>
          </div>
        </div>

        <div className="topaz95-grid-head">
          <div className="topaz95-panel topaz95-sand">
            <div className="topaz95-title">Company Information</div>
            <div className="topaz95-row topaz95-row-4">
              <label>Group Number <input className="topaz95-input" type="number" value={form.groupNumber} onChange={(e) => setField('groupNumber', e.target.value)} /></label>
              <label>Company Number <input className="topaz95-input" type="number" value={form.companyNumber} onChange={(e) => setField('companyNumber', e.target.value)} /></label>
              <label>Identity Number <input className="topaz95-input" value={form.identityNumber} onChange={(e) => setField('identityNumber', e.target.value)} /></label>
              <label>Status <input className="topaz95-input" type="number" value={form.status} onChange={(e) => setField('status', e.target.value)} /></label>
            </div>
          </div>
          <div className="topaz95-panel topaz95-black">
            <div className="topaz95-infotext">Topaz-vbe<br />from Edit<br />Systems Ltd</div>
          </div>
        </div>

        <div className="topaz95-panel topaz95-cream">
          <div className="topaz95-title">Decision Data</div>
          <div className="topaz95-body-grid">
            <div className="topaz95-left">
              <table className="topaz95-table">
                <thead>
                  <tr><th></th><th>Product 1</th><th>Product 2</th><th>Product 3</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>'Tick' to Implement Major Product Improvements</td>
                    {[0,1,2].map(i => (
                      <td key={i}><input type="checkbox" checked={!!form.majorProductImprovement[i]} onChange={() => setArr('majorProductImprovement', i, !form.majorProductImprovement[i])} /></td>
                    ))}
                  </tr>
                  <tr><td>Prices: Export Market</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.pricesExport[i]} onChange={(e) => setArr('pricesExport', i, e.target.value)} /></td>)}</tr>
                  <tr><td>Prices: Home Markets</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.pricesHome[i]} onChange={(e) => setArr('pricesHome', i, e.target.value)} /></td>)}</tr>
                  <tr><td>Promotion Expenditure: Trade Press (£'000)</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.advTradePress[i]} onChange={(e) => setArr('advTradePress', i, e.target.value)} /></td>)}</tr>
                  <tr><td>Promotion Expenditure: Advertising Support (£'000)</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.advPressTV[i]} onChange={(e) => setArr('advPressTV', i, e.target.value)} /></td>)}</tr>
                  <tr><td>Promotion Expenditure: Merchandising (£'000)</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.advMerchandising[i]} onChange={(e) => setArr('advMerchandising', i, e.target.value)} /></td>)}</tr>
                  <tr><td>Assembly Time (Minutes)</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.assemblyTime[i]} onChange={(e) => setArr('assemblyTime', i, e.target.value)} /></td>)}</tr>
                  <tr><td>Research Expenditure (£'000)</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.researchExpenditure[i]} onChange={(e) => setArr('researchExpenditure', i, e.target.value)} /></td>)}</tr>
                </tbody>
              </table>

              <div className="topaz95-row topaz95-row-4" style={{ marginTop: 10 }}>
                <label>Salespeople Export <input className="topaz95-input" type="number" value={form.spExport} onChange={(e) => setField('spExport', e.target.value)} /></label>
                <label>Salespeople South <input className="topaz95-input" type="number" value={form.spSouth} onChange={(e) => setField('spSouth', e.target.value)} /></label>
                <label>Salespeople West <input className="topaz95-input" type="number" value={form.spWest} onChange={(e) => setField('spWest', e.target.value)} /></label>
                <label>Salespeople North <input className="topaz95-input" type="number" value={form.spNorth} onChange={(e) => setField('spNorth', e.target.value)} /></label>
              </div>

              <div className="topaz95-row topaz95-row-3" style={{ marginTop: 8 }}>
                <label>Salespeople Salary (£'000) <input className="topaz95-input" type="number" value={form.quarterlySalary} onChange={(e) => setField('quarterlySalary', e.target.value)} /></label>
                <label>% Sales Commission <input className="topaz95-input" type="number" value={form.salesCommission} onChange={(e) => setField('salesCommission', e.target.value)} /></label>
                <label>Shift Level (1/2/3) <input className="topaz95-input" type="number" min={1} max={3} value={form.shiftLevel} onChange={(e) => setField('shiftLevel', e.target.value)} /></label>
              </div>

              <div className="topaz95-row topaz95-row-3" style={{ marginTop: 8 }}>
                <label>Assembly Workers Hourly Wage <input className="topaz95-input" type="number" step="0.01" value={form.assemblyWageRate} onChange={(e) => setField('assemblyWageRate', e.target.value)} /></label>
                <label>Quarterly Management Budget (£'000) <input className="topaz95-input" type="number" value={form.managementBudget} onChange={(e) => setField('managementBudget', e.target.value)} /></label>
                <label>Maintenance Hours <input className="topaz95-input" type="number" value={form.maintenanceHours} onChange={(e) => setField('maintenanceHours', e.target.value)} /></label>
              </div>
            </div>

            <div className="topaz95-right">
              <div className="topaz95-row topaz95-row-2">
                <label>Dividend Rate (pence/share) <input className="topaz95-input" type="number" value={form.dividendRate} onChange={(e) => setField('dividendRate', e.target.value)} /></label>
                <label>Days Credit Allowed <input className="topaz95-input" type="number" value={form.daysCreditAllowed} onChange={(e) => setField('daysCreditAllowed', e.target.value)} /></label>
              </div>

              <div className="topaz95-row topaz95-row-2" style={{ marginTop: 8 }}>
                <label>Vans to Buy <input className="topaz95-input" type="number" value={form.vansToBuy} onChange={(e) => setField('vansToBuy', e.target.value)} /></label>
                <label>Vans to Sell <input className="topaz95-input" type="number" value={form.vansToSell} onChange={(e) => setField('vansToSell', e.target.value)} /></label>
              </div>

              <div className="topaz95-checks" style={{ marginTop: 8 }}>
                <label><input type="checkbox" checked={form.infoOnCompanies} onChange={(e) => setField('infoOnCompanies', e.target.checked)} /> Information on Other Companies</label>
                <label><input type="checkbox" checked={form.infoOnMarketShares} onChange={(e) => setField('infoOnMarketShares', e.target.checked)} /> Information on Market Shares</label>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700 }}>Make and Deliver Products To:</div>
              <table className="topaz95-table" style={{ marginTop: 4 }}>
                <thead>
                  <tr><th>Area</th><th>Product 1</th><th>Product 2</th><th>Product 3</th></tr>
                </thead>
                <tbody>
                  <tr><td>Export Area</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.deliveryExport[i]} onChange={(e) => setArr('deliveryExport', i, e.target.value)} /></td>)}</tr>
                  <tr><td>South Area</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.deliverySouth[i]} onChange={(e) => setArr('deliverySouth', i, e.target.value)} /></td>)}</tr>
                  <tr><td>West Area</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.deliveryWest[i]} onChange={(e) => setArr('deliveryWest', i, e.target.value)} /></td>)}</tr>
                  <tr><td>North Area</td>{[0,1,2].map(i => <td key={i}><input className="topaz95-input" type="number" value={form.deliveryNorth[i]} onChange={(e) => setArr('deliveryNorth', i, e.target.value)} /></td>)}</tr>
                </tbody>
              </table>

              <div className="topaz95-row topaz95-row-3" style={{ marginTop: 8 }}>
                <label>Salespeople Recruit <input className="topaz95-input" type="number" value={form.spRecruit} onChange={(e) => setField('spRecruit', e.target.value)} /></label>
                <label>Dismiss <input className="topaz95-input" type="number" value={form.spDismiss} onChange={(e) => setField('spDismiss', e.target.value)} /></label>
                <label>Train <input className="topaz95-input" type="number" value={form.spTrain} onChange={(e) => setField('spTrain', e.target.value)} /></label>
              </div>

              <div className="topaz95-row topaz95-row-3" style={{ marginTop: 8 }}>
                <label>Assembly Workers Recruit <input className="topaz95-input" type="number" value={form.awRecruit} onChange={(e) => setField('awRecruit', e.target.value)} /></label>
                <label>Dismiss <input className="topaz95-input" type="number" value={form.awDismiss} onChange={(e) => setField('awDismiss', e.target.value)} /></label>
                <label>Train <input className="topaz95-input" type="number" value={form.awTrain} onChange={(e) => setField('awTrain', e.target.value)} /></label>
              </div>

              <div className="topaz95-row topaz95-row-3" style={{ marginTop: 8 }}>
                <label>Raw Material Units to Order <input className="topaz95-input" type="number" value={form.materialsUnits} onChange={(e) => setField('materialsUnits', e.target.value)} /></label>
                <label>Supplier No. <input className="topaz95-input" type="number" value={form.materialsSupplier} onChange={(e) => setField('materialsSupplier', e.target.value)} /></label>
                <label>No. of Deliveries <input className="topaz95-input" type="number" value={form.materialsDeliveries} onChange={(e) => setField('materialsDeliveries', e.target.value)} /></label>
              </div>

              <div className="topaz95-row topaz95-row-2" style={{ marginTop: 8 }}>
                <label>New Machines to Order <input className="topaz95-input" type="number" value={form.newMachinesToOrder} onChange={(e) => setField('newMachinesToOrder', e.target.value)} /></label>
                <label>Machines to Sell <input className="topaz95-input" type="number" value={form.machinesToSell} onChange={(e) => setField('machinesToSell', e.target.value)} /></label>
              </div>
            </div>
          </div>
        </div>

        <div className="topaz95-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Processing...' : 'Process Topaz Decision Sheet'}
          </button>
        </div>
      </form>
    </div>
  );
}
