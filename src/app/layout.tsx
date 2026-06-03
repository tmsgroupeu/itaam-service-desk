import type { Metadata } from 'next'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'ITAAM ?" IT Asset & Access Management',
  description: 'Internal IT Asset & Access Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Sidebar />

          <div className="main-content">
            <header className="header">
              <form action="/search" method="GET" className="search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input name="q" className="search-input" type="search" placeholder="Search employees, assets, serials..." />
              </form>
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
