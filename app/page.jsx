'use client';

import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { LayoutDashboard, ClipboardList, FileText, TrendingUp, Menu, X } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import DecisionForm from '@/components/DecisionForm';
import ManagementReport from '@/components/ManagementReport';
import Analytics from '@/components/Analytics';

function Sidebar({ view, onNavigate, reportData, groupNumber, companyNumber, onGroupChange, onCompanyChange, onClose, isOpen }) {
  const nav = (target) => { onNavigate(target); if (onClose) onClose(); };
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

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '14px 16px', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: '#64748B' }}>Topaz VBE Simulation</div>
          <div>Business Strategy Game</div>
        </div>
      </div>
    </aside>
  );
}

export default function HomePage() {
  const [view, setView] = useState('dashboard');
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
    dashboard: 'Overview',
    form: 'Submit Decisions',
    report: 'Management Report',
    analytics: 'Analytics',
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
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
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
        </main>
      </div>
    </div>
  );
}
