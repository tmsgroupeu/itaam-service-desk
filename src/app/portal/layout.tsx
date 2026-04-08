'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <header className="header" style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem' }}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">IT</div>
          Employee Portal
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => signOut()}>Sign Out</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {children}
      </main>
    </div>
  )
}
