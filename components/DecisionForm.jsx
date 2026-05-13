'use client';

import { useState, useEffect } from 'react';
import { getDefaults, submitDecisions } from '@/lib/api';
import { toast } from 'react-toastify';
import { Lightbulb, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { PRODUCT_SPECS, BUSINESS_INTELLIGENCE } from '@/lib/services/tables';

const fmt = (n) => {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-GB');
};
const fmtP = (n) => {
  if (n === null || n === undefined) return '—';
  return Number(n).toFixed(1);
};

function Field({ label, children, error }) {
  return (
    <div>
      <label className="fl">{label}</label>
      {children}
      {error && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 3 }}>{error}</div>}
    </div>
  );
}

function NInput({ name, value, onChange, min = 0, step = 1, err }) {
  return (
    <input
      type="number"
      name={name}
      value={value ?? ''}
      onChange={onChange}
      min={min}
      step={step}
      className={`fi${err ? ' fi-err' : ''}`}
    />
  );
}

export default function DecisionForm({ onSubmitSuccess, groupNumber: propGroup, companyNumber: propCompany }) {
  const NUM = 3;
  const TOTAL_STEPS = 5;
  const STEP_LABELS = ['Setup', 'Marketing', 'Operations', 'Personnel', 'Review'];
  const STEP_HINTS = [
    'Set the period and number of products before filling decisions.',
    'Higher advertising raises market share. Prices affect demand via elasticity — cutting price below base erodes margin.',
    'Shift level 2 doubles capacity but adds 25% wage premium. Maintenance above 4 hrs/machine minimises breakdowns.',
    'Recruiting costs £3,000/salesperson. Dismissal costs £5,000. Training improves performance at £2,000/person.',
    'Review all decisions carefully. Submitted quarters cannot be resubmitted once processed.',
  ];

  const [step, setStep] = useState(1);
  const [activeProduct, setActiveProduct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [previousResults, setPreviousResults] = useState(null);

  const [form, setForm] = useState({
    simulationCode: '', year: 2006, quarter: 4,
    groupNumber: propGroup || 1, companyNumber: propCompany || 1,
    identityNumber: '', status: 2,
    numProducts: NUM,
    majorProductImprovement: [false, false, false],
    pricesExport: [0, 0, 0], pricesHome: [0, 0, 0],
    advTradePress: [0, 0, 0], advPressTV: [0, 0, 0], advMerchandising: [0, 0, 0],
    assemblyTime: [0, 0, 0],
    deliveryExport: [0, 0, 0], deliverySouth: [0, 0, 0], deliveryWest: [0, 0, 0], deliveryNorth: [0, 0, 0],
    researchExpenditure: [0, 0, 0],
    spExport: 0, spSouth: 0, spWest: 0, spNorth: 0,
    quarterlySalary: 0, salesCommission: 0,
    assemblyWageRate: 6.95, shiftLevel: 2,
    maintenanceHours: 0, managementBudget: 0,
    dividendRate: 0, daysCreditAllowed: 30,
    machinesToSell: 0, newMachinesToOrder: 0,
    vansToBuy: 0, vansToSell: 0,
    infoOnCompanies: false, infoOnMarketShares: false,
    spRecruit: 0, spDismiss: 0, spTrain: 0,
    awRecruit: 0, awDismiss: 0, awTrain: 0,
    materialsUnits: 0, materialsSupplier: 0, materialsDeliveries: 0,
  });

  useEffect(() => { loadDefaults(); }, []);

  const loadDefaults = async () => {
    try {
      setLoading(true);
      const gn = propGroup || form.groupNumber;
      const cn = propCompany || form.companyNumber;
      const { data } = await getDefaults(gn, cn, NUM);
      const d = data.decisions;
      setPreviousResults(data.previousResults);
      setForm(p => ({
        ...p,
        groupNumber: gn, companyNumber: cn,
        year: data.year || 2006, quarter: data.quarter || 4,
        majorProductImprovement: d.majorProductImprovement || [false, false, false],
        pricesExport: d.prices?.export || [0, 0, 0], pricesHome: d.prices?.home || [0, 0, 0],
        advTradePress: d.advertising?.tradePress || [0, 0, 0], advPressTV: d.advertising?.pressTV || [0, 0, 0], advMerchandising: d.advertising?.merchandising || [0, 0, 0],
        assemblyTime: d.assemblyTime || [0, 0, 0],
        deliveryExport: d.deliverySchedule?.export || [0, 0, 0], deliverySouth: d.deliverySchedule?.south || [0, 0, 0],
        deliveryWest: d.deliverySchedule?.west || [0, 0, 0], deliveryNorth: d.deliverySchedule?.north || [0, 0, 0],
        researchExpenditure: d.researchExpenditure || [0, 0, 0],
        spExport: d.salespeople?.export || 0, spSouth: d.salespeople?.south || 0,
        spWest: d.salespeople?.west || 0, spNorth: d.salespeople?.north || 0,
        quarterlySalary: d.salespeopleRemuneration?.quarterlySalary || 0,
        salesCommission: d.salespeopleRemuneration?.salesCommission || 0,
        assemblyWageRate: d.assemblyWageRate || 6.95, shiftLevel: d.shiftLevel || 2,
        maintenanceHours: d.maintenanceHours || 0, managementBudget: d.managementBudget || 0,
        dividendRate: d.dividendRate || 0, daysCreditAllowed: d.daysCreditAllowed || 30,
        machinesToSell: d.machinesToSell || 0, newMachinesToOrder: d.newMachinesToOrder || 0,
        vansToBuy: d.vansToBuy || 0, vansToSell: d.vansToSell || 0,
        infoOnCompanies: d.infoOnCompanies || false, infoOnMarketShares: d.infoOnMarketShares || false,
        spRecruit: d.personnel?.salespeople?.recruit || 0, spDismiss: d.personnel?.salespeople?.dismiss || 0, spTrain: d.personnel?.salespeople?.train || 0,
        awRecruit: d.personnel?.assemblyWorkers?.recruit || 0, awDismiss: d.personnel?.assemblyWorkers?.dismiss || 0, awTrain: d.personnel?.assemblyWorkers?.train || 0,
        materialsUnits: d.materials?.unitsToOrder || 0, materialsSupplier: d.materials?.supplierNo || 0, materialsDeliveries: d.materials?.numDeliveries || 0,
      }));
    } catch (err) {
      console.error('Failed to load defaults:', err);
      toast.error('Failed to load default values');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value) }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
  };
  const handleArr = (field, i, val) => {
    setForm(p => { const a = [...(p[field] || [])]; a[i] = val === '' ? '' : Number(val); return { ...p, [field]: a }; });
    if (errors[`${field}_${i}`]) setErrors(p => ({ ...p, [`${field}_${i}`]: null }));
  };
  const handleChk = (i) => {
    setForm(p => { const a = [...(p.majorProductImprovement || [])]; a[i] = !a[i]; return { ...p, majorProductImprovement: a }; });
  };

  const validate = () => {
    const e = {};
    if (!form.year) e.year = 'Required';
    if (!form.quarter || form.quarter < 1 || form.quarter > 4) e.quarter = '1-4';
    if (!form.groupNumber) e.groupNumber = 'Required';
    if (!form.companyNumber) e.companyNumber = 'Required';
    if (![1,2,3].includes(Number(form.shiftLevel))) e.shiftLevel = '1-3';
    ['spExport','spSouth','spWest','spNorth','quarterlySalary','salesCommission','maintenanceHours','managementBudget','dividendRate','daysCreditAllowed','machinesToSell','newMachinesToOrder','vansToBuy','vansToSell','spRecruit','spDismiss','spTrain','awRecruit','awDismiss','awTrain','materialsUnits','materialsSupplier','materialsDeliveries'].forEach(f => {
      const v = form[f]; if (v===''||v===null||v===undefined) e[f]='Required'; else if(v<0) e[f]='No negatives';
    });
    if (form.assemblyWageRate === '' || form.assemblyWageRate < 0) e.assemblyWageRate = 'Required';
    ['pricesExport','pricesHome','advTradePress','advPressTV','advMerchandising','assemblyTime','deliveryExport','deliverySouth','deliveryWest','deliveryNorth','researchExpenditure'].forEach(f => {
      for (let i=0;i<NUM;i++){const v=form[f]?.[i]; if(v===''||v===null||v===undefined) e[`${f}_${i}`]='Required'; else if(v<0) e[`${f}_${i}`]='No neg';}
    });
    if (previousResults) {
      const am = previousResults.machines?.availableNextQuarter || 10;
      if (form.machinesToSell > am) e.machinesToSell = `Max ${am}`;
      const av = previousResults.vehicles?.availableLastQuarter || 17;
      if (form.vansToSell > av) e.vansToSell = `Max ${av}`;
    }
    setErrors(e); return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    simulationCode: form.simulationCode, groupNumber: form.groupNumber, companyNumber: form.companyNumber,
    identityNumber: form.identityNumber, year: form.year, quarter: form.quarter, status: form.status, numProducts: NUM,
    decisions: {
      majorProductImprovement: form.majorProductImprovement,
      prices: { export: form.pricesExport.map(Number), home: form.pricesHome.map(Number) },
      advertising: { tradePress: form.advTradePress.map(Number), pressTV: form.advPressTV.map(Number), merchandising: form.advMerchandising.map(Number) },
      assemblyTime: form.assemblyTime.map(Number),
      salespeople: { export: +form.spExport, south: +form.spSouth, west: +form.spWest, north: +form.spNorth },
      salespeopleRemuneration: { quarterlySalary: +form.quarterlySalary, salesCommission: +form.salesCommission },
      assemblyWageRate: +form.assemblyWageRate, shiftLevel: +form.shiftLevel, maintenanceHours: +form.maintenanceHours,
      deliverySchedule: { export: form.deliveryExport.map(Number), south: form.deliverySouth.map(Number), west: form.deliveryWest.map(Number), north: form.deliveryNorth.map(Number) },
      managementBudget: +form.managementBudget, dividendRate: +form.dividendRate, daysCreditAllowed: +form.daysCreditAllowed,
      machinesToSell: +form.machinesToSell, newMachinesToOrder: +form.newMachinesToOrder,
      vansToBuy: +form.vansToBuy, vansToSell: +form.vansToSell,
      infoOnCompanies: form.infoOnCompanies, infoOnMarketShares: form.infoOnMarketShares,
      researchExpenditure: form.researchExpenditure.map(Number),
      personnel: {
        salespeople: { recruit: +form.spRecruit, dismiss: +form.spDismiss, train: +form.spTrain },
        assemblyWorkers: { recruit: +form.awRecruit, dismiss: +form.awDismiss, train: +form.awTrain },
      },
      materials: { unitsToOrder: +form.materialsUnits, supplierNo: +form.materialsSupplier, numDeliveries: +form.materialsDeliveries },
    },
  });

  const handleSubmit = async () => {
    if (!validate()) { toast.error('Fix errors before submitting'); return; }
    try {
      setSubmitting(true);
      const { data } = await submitDecisions(buildPayload());
      toast.success(data.message || 'Quarter processed!');
      if (onSubmitSuccess) onSubmitSuccess(data.data);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const NUM_P = form.numProducts || NUM;
  const productTabs = Array.from({ length: Math.min(Math.max(1, NUM_P), 8) }, (_, i) => i);

  const StepBar = () => (
    <div className="step-bar">
      {STEP_LABELS.map((label, idx) => {
        const n = idx + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'flex-start', flex: n < TOTAL_STEPS ? 1 : 'none' }}>
            <div className="step-col">
              <div className={`step-dot${done ? ' s-done' : active ? ' s-active' : ''}`}>
                {done ? <Check size={12} /> : n}
              </div>
              <div className={`step-label${active ? ' s-active' : ''}`}>{label}</div>
            </div>
            {n < TOTAL_STEPS && <div className={`step-line${done ? ' s-done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );

  const ProductTabs = () => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
      {productTabs.map(i => (
        <button key={i} type="button" onClick={() => setActiveProduct(i)}
          style={{
            padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500,
            fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
            background: activeProduct === i ? '#6366F1' : '#F1F5F9',
            color: activeProduct === i ? '#fff' : '#64748B', border: 'none',
          }}>
          P{i + 1}
        </button>
      ))}
    </div>
  );

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height: 256 }}>
      <div style={{ color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>Loading defaults...</div>
    </div>
  );

  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
  const SectionLabel = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E2E8F0', margin: '16px 0 10px' }}>{children}</div>
  );
  const Divider = () => <div style={{ height: 1, background: '#F1F5F9', margin: '16px 0' }} />;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (step === TOTAL_STEPS) handleSubmit(); }} style={{ maxWidth: 760, margin: '0 auto' }}>
      <StepBar />
      <div className="alert-info">
        <Lightbulb size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{STEP_HINTS[step - 1]}</span>
      </div>

      {step === 1 && (
        <div className="d-card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Session Setup</div>
          <div style={g2}>
            <Field label="Simulation Code" error={errors.simulationCode}>
              <input type="text" name="simulationCode" value={form.simulationCode} onChange={handleChange} className={`fi${errors.simulationCode ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Year" error={errors.year}>
              <NInput name="year" value={form.year} onChange={handleChange} err={errors.year} />
            </Field>
            <Field label="Quarter (1-4)" error={errors.quarter}>
              <NInput name="quarter" value={form.quarter} onChange={handleChange} min={1} err={errors.quarter} />
            </Field>
            <Field label="Group Number" error={errors.groupNumber}>
              <NInput name="groupNumber" value={form.groupNumber} onChange={handleChange} err={errors.groupNumber} />
            </Field>
            <Field label="Company Number" error={errors.companyNumber}>
              <NInput name="companyNumber" value={form.companyNumber} onChange={handleChange} err={errors.companyNumber} />
            </Field>
            <Field label="Identity Number">
              <input type="text" name="identityNumber" value={form.identityNumber} onChange={handleChange} className="fi" />
            </Field>
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} className="fi">
                <option value={0}>0 - Draft</option>
                <option value={1}>1 - Active</option>
                <option value={2}>2 - Submitted</option>
              </select>
            </Field>
            <Field label="Number of Products (1-8)">
              <NInput name="numProducts" value={form.numProducts} onChange={handleChange} min={1} />
            </Field>
          </div>
          {previousResults && (
            <div>
              <Divider />
              <div className="d-card-sm" style={{ background: '#F1F5F9' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Previous Quarter</div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Share Price</div>
                    <div className="mono" style={{ fontSize: 18, color: '#6366F1', marginTop: 2 }}>{Number(previousResults.sharePrice || 0).toFixed(1)}p</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Net Profit</div>
                    <div className={`mono ${(previousResults.profitAndLoss?.netProfit || 0) >= 0 ? 'val-pos' : 'val-neg'}`} style={{ fontSize: 18, marginTop: 2 }}>
                      {fmt(previousResults.profitAndLoss?.netProfit)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Gross Profit</div>
                    <div className="mono" style={{ fontSize: 18, color: '#0F172A', marginTop: 2 }}>{fmt(previousResults.profitAndLoss?.grossProfit)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="d-card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Marketing Decisions</div>
          <ProductTabs />
          <div style={{ ...g2, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id={`mpi-${activeProduct}`}
                checked={form.majorProductImprovement?.[activeProduct] || false}
                onChange={() => handleChk(activeProduct)}
                style={{ accentColor: '#6366F1', width: 16, height: 16 }} />
              <label htmlFor={`mpi-${activeProduct}`} style={{ fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                Major Product Improvement this quarter (Product {activeProduct + 1})
              </label>
            </div>
          </div>
          <div style={g2}>
            <Field label="Export Price" error={errors[`pricesExport_${activeProduct}`]}>
              <input type="number" value={form.pricesExport?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('pricesExport', activeProduct, e.target.value)}
                className={`fi${errors[`pricesExport_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Home Price" error={errors[`pricesHome_${activeProduct}`]}>
              <input type="number" value={form.pricesHome?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('pricesHome', activeProduct, e.target.value)}
                className={`fi${errors[`pricesHome_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Adv Trade Press" error={errors[`advTradePress_${activeProduct}`]}>
              <input type="number" value={form.advTradePress?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('advTradePress', activeProduct, e.target.value)}
                className={`fi${errors[`advTradePress_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Adv Press and TV" error={errors[`advPressTV_${activeProduct}`]}>
              <input type="number" value={form.advPressTV?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('advPressTV', activeProduct, e.target.value)}
                className={`fi${errors[`advPressTV_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Adv Merchandising" error={errors[`advMerchandising_${activeProduct}`]}>
              <input type="number" value={form.advMerchandising?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('advMerchandising', activeProduct, e.target.value)}
                className={`fi${errors[`advMerchandising_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Research Expenditure" error={errors[`researchExpenditure_${activeProduct}`]}>
              <input type="number" value={form.researchExpenditure?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('researchExpenditure', activeProduct, e.target.value)}
                className={`fi${errors[`researchExpenditure_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
          </div>
          {PRODUCT_SPECS[activeProduct] && (
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 12, fontFamily: 'JetBrains Mono, monospace' }}>
              Base price for Product {activeProduct + 1}: {PRODUCT_SPECS[activeProduct].basePrice}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="d-card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Operations</div>
          <ProductTabs />
          <div style={g2}>
            <Field label="Assembly Time (mins)" error={errors[`assemblyTime_${activeProduct}`]}>
              <input type="number" value={form.assemblyTime?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('assemblyTime', activeProduct, e.target.value)}
                className={`fi${errors[`assemblyTime_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Delivery Export" error={errors[`deliveryExport_${activeProduct}`]}>
              <input type="number" value={form.deliveryExport?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('deliveryExport', activeProduct, e.target.value)}
                className={`fi${errors[`deliveryExport_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Delivery South" error={errors[`deliverySouth_${activeProduct}`]}>
              <input type="number" value={form.deliverySouth?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('deliverySouth', activeProduct, e.target.value)}
                className={`fi${errors[`deliverySouth_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Delivery West" error={errors[`deliveryWest_${activeProduct}`]}>
              <input type="number" value={form.deliveryWest?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('deliveryWest', activeProduct, e.target.value)}
                className={`fi${errors[`deliveryWest_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
            <Field label="Delivery North" error={errors[`deliveryNorth_${activeProduct}`]}>
              <input type="number" value={form.deliveryNorth?.[activeProduct] ?? ''} min={0}
                onChange={e => handleArr('deliveryNorth', activeProduct, e.target.value)}
                className={`fi${errors[`deliveryNorth_${activeProduct}`] ? ' fi-err' : ''}`} />
            </Field>
          </div>
          <Divider />
          <SectionLabel>Company-Wide Settings</SectionLabel>
          <div style={g2}>
            <Field label="Assembly Wage Rate" error={errors.assemblyWageRate}>
              <NInput name="assemblyWageRate" value={form.assemblyWageRate} onChange={handleChange} step={0.01} err={errors.assemblyWageRate} />
            </Field>
            <Field label="Shift Level" error={errors.shiftLevel}>
              <select name="shiftLevel" value={form.shiftLevel} onChange={handleChange} className={`fi${errors.shiftLevel ? ' fi-err' : ''}`}>
                <option value={1}>1 - Single</option>
                <option value={2}>2 - Double</option>
                <option value={3}>3 - Triple</option>
              </select>
            </Field>
            <Field label="Maintenance Hours/Machine" error={errors.maintenanceHours}>
              <NInput name="maintenanceHours" value={form.maintenanceHours} onChange={handleChange} err={errors.maintenanceHours} />
            </Field>
            <Field label="New Machines to Order" error={errors.newMachinesToOrder}>
              <NInput name="newMachinesToOrder" value={form.newMachinesToOrder} onChange={handleChange} err={errors.newMachinesToOrder} />
            </Field>
            <Field label="Machines to Sell" error={errors.machinesToSell}>
              <NInput name="machinesToSell" value={form.machinesToSell} onChange={handleChange} err={errors.machinesToSell} />
            </Field>
            <Field label="Vans to Buy" error={errors.vansToBuy}>
              <NInput name="vansToBuy" value={form.vansToBuy} onChange={handleChange} err={errors.vansToBuy} />
            </Field>
            <Field label="Vans to Sell" error={errors.vansToSell}>
              <NInput name="vansToSell" value={form.vansToSell} onChange={handleChange} err={errors.vansToSell} />
            </Field>
          </div>
          {Number(form.shiftLevel) === 3 && (
            <div className="alert-warn" style={{ marginTop: 12, marginBottom: 0 }}>
              <span>Warning</span>
              <span>Triple shift adds a 50% wage premium and significantly increases labour costs.</span>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="d-card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Personnel and Finance</div>
          <SectionLabel>Sales Force</SectionLabel>
          <div style={g2}>
            <Field label="Salespeople Export" error={errors.spExport}><NInput name="spExport" value={form.spExport} onChange={handleChange} err={errors.spExport} /></Field>
            <Field label="Salespeople South" error={errors.spSouth}><NInput name="spSouth" value={form.spSouth} onChange={handleChange} err={errors.spSouth} /></Field>
            <Field label="Salespeople West" error={errors.spWest}><NInput name="spWest" value={form.spWest} onChange={handleChange} err={errors.spWest} /></Field>
            <Field label="Salespeople North" error={errors.spNorth}><NInput name="spNorth" value={form.spNorth} onChange={handleChange} err={errors.spNorth} /></Field>
            <Field label="Quarterly Salary" error={errors.quarterlySalary}><NInput name="quarterlySalary" value={form.quarterlySalary} onChange={handleChange} err={errors.quarterlySalary} /></Field>
            <Field label="Sales Commission %" error={errors.salesCommission}><NInput name="salesCommission" value={form.salesCommission} onChange={handleChange} err={errors.salesCommission} /></Field>
            <Field label="SP Recruit" error={errors.spRecruit}><NInput name="spRecruit" value={form.spRecruit} onChange={handleChange} err={errors.spRecruit} /></Field>
            <Field label="SP Dismiss" error={errors.spDismiss}><NInput name="spDismiss" value={form.spDismiss} onChange={handleChange} err={errors.spDismiss} /></Field>
            <Field label="SP Train" error={errors.spTrain}><NInput name="spTrain" value={form.spTrain} onChange={handleChange} err={errors.spTrain} /></Field>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
            Recruit 3000/sp - Dismiss 5000/sp - Train 2000/sp
          </div>
          <Divider />
          <SectionLabel>Assembly Workers</SectionLabel>
          <div style={g2}>
            <Field label="AW Recruit" error={errors.awRecruit}><NInput name="awRecruit" value={form.awRecruit} onChange={handleChange} err={errors.awRecruit} /></Field>
            <Field label="AW Dismiss" error={errors.awDismiss}><NInput name="awDismiss" value={form.awDismiss} onChange={handleChange} err={errors.awDismiss} /></Field>
            <Field label="AW Train" error={errors.awTrain}><NInput name="awTrain" value={form.awTrain} onChange={handleChange} err={errors.awTrain} /></Field>
          </div>
          <Divider />
          <SectionLabel>Materials</SectionLabel>
          <div style={g2}>
            <Field label="Units to Order" error={errors.materialsUnits}><NInput name="materialsUnits" value={form.materialsUnits} onChange={handleChange} err={errors.materialsUnits} /></Field>
            <Field label="Supplier No." error={errors.materialsSupplier}><NInput name="materialsSupplier" value={form.materialsSupplier} onChange={handleChange} err={errors.materialsSupplier} /></Field>
            <Field label="Num Deliveries" error={errors.materialsDeliveries}><NInput name="materialsDeliveries" value={form.materialsDeliveries} onChange={handleChange} err={errors.materialsDeliveries} /></Field>
          </div>
          <Divider />
          <SectionLabel>Finance</SectionLabel>
          <div style={g2}>
            <Field label="Management Budget" error={errors.managementBudget}><NInput name="managementBudget" value={form.managementBudget} onChange={handleChange} err={errors.managementBudget} /></Field>
            <Field label="Dividend Rate %" error={errors.dividendRate}><NInput name="dividendRate" value={form.dividendRate} onChange={handleChange} err={errors.dividendRate} /></Field>
            <Field label="Days Credit Allowed" error={errors.daysCreditAllowed}><NInput name="daysCreditAllowed" value={form.daysCreditAllowed} onChange={handleChange} err={errors.daysCreditAllowed} /></Field>
          </div>
          <Divider />
          <SectionLabel>Business Intelligence</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" name="infoOnCompanies" checked={form.infoOnCompanies} onChange={handleChange}
                style={{ accentColor: '#6366F1', width: 16, height: 16 }} />
              <span style={{ fontSize: 13, color: '#475569' }}>
                Info on Other Companies
                <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginLeft: 8 }}>({BUSINESS_INTELLIGENCE.companyInfo.toLocaleString()})</span>
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" name="infoOnMarketShares" checked={form.infoOnMarketShares} onChange={handleChange}
                style={{ accentColor: '#6366F1', width: 16, height: 16 }} />
              <span style={{ fontSize: 13, color: '#475569' }}>
                Info on Market Shares
                <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginLeft: 8 }}>({BUSINESS_INTELLIGENCE.marketShares.toLocaleString()})</span>
              </span>
            </label>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="d-card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Review and Submit</div>
          {previousResults && (
            <div className="alert-info" style={{ marginBottom: 16 }}>
              <span>Previous quarter:</span>
              <span>
                Share Price {Number(previousResults.sharePrice || 0).toFixed(1)}p - Net Profit {fmt(previousResults.profitAndLoss?.netProfit)}
              </span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="d-card-sm" style={{ background: '#F1F5F9' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Marketing Summary</div>
              {productTabs.map(i => (
                <div key={i} style={{ fontSize: 12, color: '#475569', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                  P{i+1}: Export {form.pricesExport?.[i] || 0} / Home {form.pricesHome?.[i] || 0}
                </div>
              ))}
            </div>
            <div className="d-card-sm" style={{ background: '#F1F5F9' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Operations Summary</div>
              {productTabs.map(i => (
                <div key={i} style={{ fontSize: 12, color: '#475569', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                  P{i+1} Assembly: {form.assemblyTime?.[i] || 0} min
                </div>
              ))}
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                Shift: {form.shiftLevel} - Maint: {form.maintenanceHours}h
              </div>
            </div>
            <div className="d-card-sm" style={{ background: '#F1F5F9' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Personnel Summary</div>
              <div style={{ fontSize: 12, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                <div>SP: {(Number(form.spExport||0)+Number(form.spSouth||0)+Number(form.spWest||0)+Number(form.spNorth||0))} total</div>
                <div>Salary {form.quarterlySalary}00 - Commission {form.salesCommission}%</div>
              </div>
            </div>
            <div className="d-card-sm" style={{ background: '#F1F5F9' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Finance Summary</div>
              <div style={{ fontSize: 12, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                <div>Budget: {form.managementBudget}k</div>
                <div>Dividend: {form.dividendRate}%</div>
                <div>Credit: {form.daysCreditAllowed} days</div>
              </div>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }}>
            {submitting ? 'Processing...' : `Submit Q${form.quarter} ${form.year} Decisions`}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        {step > 1 ? (
          <button type="button" className="btn-ghost" onClick={() => setStep(s => s - 1)}>
            <ChevronLeft size={14} /> Back
          </button>
        ) : <span />}
        {step < TOTAL_STEPS && (
          <button type="button" className="btn-primary" onClick={() => setStep(s => s + 1)}>
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </form>
  );
}
