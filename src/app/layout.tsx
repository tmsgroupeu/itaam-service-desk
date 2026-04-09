import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'ITAAM – IT Asset & Access Management',
  description: 'Internal IT Asset & Access Management System',
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { href: '/users', label: 'User Directory', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: '/accounts', label: 'M365 Directory', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { href: '/hardware', label: 'Hardware Inventory', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { href: '/access', label: 'Access Matrix', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { href: '/tickets', label: 'Service Desk', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> },
]

const workflowItems = [
  { href: '/workflows/onboard', label: 'Onboarding', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
  { href: '/workflows/offboard', label: 'Offboarding', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">IT</div>
              ITAAM
            </div>

            <nav>
              <div className="nav-section">Core</div>
              {navItems.map(item => (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              <div className="nav-section">Workflows</div>
              {workflowItems.map(item => (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>Super Admin</div>
                <div>IT Department</div>
              </div>
            </div>
          </aside>

          <div className="main-content">
            <header className="header">
              <div className="search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input className="search-input" type="search" placeholder="Search employees, assets, serials…" />
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link href="/workflows/onboard" className="btn btn-primary btn-sm">+ Onboard</Link>
              </div>
            </header>

            <div className="page-scroll">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
