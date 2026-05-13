'use client';

import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import {
  LayoutDashboard, ClipboardList, FileText, TrendingUp, Menu, X,
  ShieldCheck, Landmark, FlaskConical, ChevronRight, NotebookPen,
} from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import DecisionForm from '@/components/DecisionForm';
import ManagementReport from '@/components/ManagementReport';
import Analytics from '@/components/Analytics';
import ControlCenter from '@/components/ControlCenter';
import TreasuryLab from '@/components/TreasuryLab';
import ScenarioLab from '@/components/ScenarioLab';
import TopazClassicForm from '@/components/TopazClassicForm';

function Sidebar({ view, onNavigate, reportData, groupNumber, companyNumber, onGroupChange, onCompanyChange, onClose, isOpen }) {
  const nav = (target) => { onNavigate(target); if (onClose) onClose(); };

  const quickLinks = [
    { id: 'classic', label: 'Topaz Classic Sheet', section: 'Core' },
    { id: 'dashboard', label: 'Overview', section: 'Core' },
    { id: 'form', label: 'Decision Form', section: 'Core' },
    { id: 'report', label: 'Management Report', section: 'Core' },
    { id: 'analytics', label: 'Analytics', section: 'Core' },
    { id: 'control', label: 'Control Center', section: 'Advanced' },
    { id: 'treasury', label: 'Treasury Lab', section: 'Advanced' },
    { id: 'scenario', label: 'Scenario Lab', section: 'Advanced' },
  ];

  return (
    <aside className={`sidebar no-print${isOpen ? ' sidebar-open' : ''}`} role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#6366F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>T</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>Topaz VBE</div>
              <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.2 }}>Simulation</div>
            </div>
          </div>
          <button className="hamburger-btn" onClick={onClose} aria-label="Close menu" style={{ display: 'none' }} id="sidebar-close-btn">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Pages">
        <div className="s-section-label">NAVIGATION</div>
        <button className={`s-link${view === 'classic' ? ' active' : ''}`} onClick={() => nav('classic')} aria-current={view === 'classic' ? 'page' : undefined}>
          <NotebookPen size={15} aria-hidden="true" /> Topaz Classic Sheet
        </button>
        <button className={`s-link${view === 'dashboard' ? ' active' : ''}`} onClick={() => nav('dashboard')} aria-current={view === 'dashboard' ? 'page' : undefined}>
          <LayoutDashboard size={15} aria-hidden="true" /> Overview
        </button>
        <button className={`s-link${view === 'form' ? ' active' : ''}`} onClick={() => nav('form')} aria-current={view === 'form' ? 'page' : undefined}>
          <ClipboardList size={15} aria-hidden="true" /> Submit Decisions
        </button>
        {reportData && (
          <button className={`s-link${view === 'report' ? ' active' : ''}`} onClick={() => nav('report')} aria-current={view === 'report' ? 'page' : undefined}>
            <FileText size={15} aria-hidden="true" /> Management Report
          </button>
        )}
        <button className={`s-link${view === 'analytics' ? ' active' : ''}`} onClick={() => nav('analytics')} aria-current={view === 'analytics' ? 'page' : undefined}>
          <TrendingUp size={15} aria-hidden="true" /> Analytics
        </button>

        <div className="s-section-label" style={{ marginTop: 8 }}>SIMULATION SUITE</div>
        <button className={`s-link${view === 'control' ? ' active' : ''}`} onClick={() => nav('control')} aria-current={view === 'control' ? 'page' : undefined}>
          <ShieldCheck size={15} aria-hidden="true" /> Executive Control Center
        </button>
        <button className={`s-link${view === 'treasury' ? ' active' : ''}`} onClick={() => nav('treasury')} aria-current={view === 'treasury' ? 'page' : undefined}>
          <Landmark size={15} aria-hidden="true" /> Treasury & Working Capital
        </button>
        <button className={`s-link${view === 'scenario' ? ' active' : ''}`} onClick={() => nav('scenario')} aria-current={view === 'scenario' ? 'page' : undefined}>
          <FlaskConical size={15} aria-hidden="true" /> Scenario & Forecast Lab
        </button>
      </nav>

      <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }} />

      {/* Company selectors */}
      <div className="s-section-label">COMPANY</div>
      <div style={{ padding: '4px 16px 8px' }}>
        <label className="fl" htmlFor="sb-group">Group Number</label>
        <input id="sb-group" type="number" className="fi" value={groupNumber} min={1}
          onChange={(e) => onGroupChange(Number(e.target.value))} />
      </div>
      <div style={{ padding: '4px 16px 8px' }}>
        <label className="fl" htmlFor="sb-company">Company Number</label>
        <input id="sb-company" type="number" className="fi" value={companyNumber} min={1}
          onChange={(e) => onCompanyChange(Number(e.target.value))} />
      </div>

      <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }} />

      <div className="s-section-label">QUICK ACCESS</div>
      <div style={{ padding: '2px 12px 10px' }}>
        {quickLinks
          .filter((q) => q.id !== 'report' || reportData)
          .map((q) => (
            <button
              key={q.id}
              onClick={() => nav(q.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: view === q.id ? '#EEF2FF' : '#FFFFFF',
                color: view === q.id ? '#4338CA' : '#334155',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '8px 10px',
                marginBottom: 6,
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
                gap: 8,
              }}
            >
              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.label}</span>
              <span style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: 4, color: '#64748B', fontSize: 10 }}>
                {q.section} <ChevronRight size={12} />
              </span>
            </button>
          ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '14px 16px', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: '#64748B' }}>Topaz VBE Simulation</div>
          <div>Business Strategy Game</div>
          <div style={{ marginTop: 4 }}>
            <span className="badge badge-indigo" style={{ fontSize: 9 }}>Feature Suite</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function HomePage() {
  const [view, setView] = useState('classic');
  const [reportData, setReportData] = useState(null);
  const [groupNumber, setGroupNumber] = useState(1);
  const [companyNumber, setCompanyNumber] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (target, data = null) => {
    if (target === 'report' && data) setReportData(data);
    setView(target);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleSubmitSuccess = (data) => {
    setReportData(data);
    setView('report');
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const viewTitles = {
    classic: 'Topaz Classic Sheet',
    dashboard: 'Overview',
    form: 'Submit Decisions',
    report: 'Management Report',
    analytics: 'Analytics',
    control: 'Executive Control Center',
    treasury: 'Treasury & Working Capital Lab',
    scenario: 'Scenario & Forecast Lab',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} closeOnClick pauseOnHover theme="light" />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop no-print"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        view={view}
        onNavigate={navigate}
        reportData={reportData}
        groupNumber={groupNumber}
        companyNumber={companyNumber}
        onGroupChange={setGroupNumber}
        onCompanyChange={setCompanyNumber}
        onClose={() => setSidebarOpen(false)}
        isOpen={sidebarOpen}
      />

      <div className="main-wrapper" style={{ flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Mobile topbar */}
        <header className="mobile-topbar no-print" role="banner">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu">
            <Menu size={20} />
          </button>
          <span className="mobile-title" style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
            Topaz VBE — {viewTitles[view] || ''}
          </span>
          <span style={{ width: 36 }} />
        </header>

        <main
          className="main-content"
          id="main-content"
          style={{ flex: 1, padding: '32px 36px', background: '#F8FAFC' }}
          aria-label={viewTitles[view]}
        >
          {view === 'classic' && (
            <TopazClassicForm
              groupNumber={groupNumber}
              companyNumber={companyNumber}
              onSubmitSuccess={handleSubmitSuccess}
            />
          )}
          {view === 'dashboard' && (
            <Dashboard onNavigate={navigate} groupNumber={groupNumber} companyNumber={companyNumber}
              onGroupChange={setGroupNumber} onCompanyChange={setCompanyNumber} />
          )}
          {view === 'form' && (
            <DecisionForm onSubmitSuccess={handleSubmitSuccess} groupNumber={groupNumber} companyNumber={companyNumber} />
          )}
          {view === 'report' && <ManagementReport data={reportData} onNavigate={navigate} />}
          {view === 'analytics' && (
            <Analytics onNavigate={navigate} groupNumber={groupNumber} companyNumber={companyNumber} />
          )}
          {view === 'control' && (
            <ControlCenter onNavigate={navigate} groupNumber={groupNumber} companyNumber={companyNumber} />
          )}
          {view === 'treasury' && (
            <TreasuryLab groupNumber={groupNumber} companyNumber={companyNumber} />
          )}
          {view === 'scenario' && (
            <ScenarioLab groupNumber={groupNumber} companyNumber={companyNumber} />
          )}
        </main>
      </div>
    </div>
  );
}
