'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TicketDetailClient } from '@/app/tickets/[id]/TicketDetailClient'
import type { User, Asset, Ticket, TicketComment } from '@prisma/client'

function statusColor(status: string) {
  const m: Record<string, string> = {
    Open: 'badge-yellow',
    'In Progress': 'badge-blue',
    'Waiting on User': 'badge-purple',
    Resolved: 'badge-green',
    Closed: 'badge-gray',
  }
  return `badge ${m[status] ?? 'badge-gray'}`
}

type FullTicket = Ticket & { author: User, asset: Asset | null, comments: TicketComment[] }

interface PortalClientProps {
  user: User & {
    assets: Asset[]
    accessPoints: any[]
    tickets: FullTicket[]
  }
}

export function PortalClient({ user }: PortalClientProps) {
  const [selectedTicket, setSelectedTicket] = useState<FullTicket | null>(null)

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Welcome, {user.name.split(' ')[0]}</h1>
          <div className="text-sm text-muted">Use this portal to view your assigned equipment and manage IT support requests.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Hardware Section */}
          <div className="card" style={{ border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                My Equipment
              </h3>
            </div>
            {user.assets.length === 0 ? (
              <div className="table-empty" style={{ padding: '2rem' }}>No hardware assigned.</div>
            ) : (
              <div className="list-group">
                {user.assets.map(asset => (
                  <div key={asset.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{asset.category}</div>
                      <div className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>{asset.brandModel}</div>
                    </div>
                    {asset.serialImei && <span className="font-mono text-xs" style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{asset.serialImei}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Access Section */}
          <div className="card" style={{ border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Digital Access
              </h3>
            </div>
            {user.accessPoints.length === 0 ? (
              <div className="table-empty" style={{ padding: '2rem' }}>No digital access granted.</div>
            ) : (
              <div className="list-group">
                {user.accessPoints.map(ua => (
                  <div key={ua.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ua.accessPoint.name}</div>
                    <div className="text-xs text-muted">Granted {new Date(ua.grantedAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tickets Section */}
        <div className="card" style={{ alignSelf: 'start', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              My Support Tickets
            </h3>
            <Link href="/portal/new-ticket" className="btn btn-primary btn-sm" style={{ padding: '0.4rem 1rem' }}>+ New Ticket</Link>
          </div>
          {user.tickets.length === 0 ? (
            <div className="table-empty" style={{ padding: '3rem' }}>You have no past or active support requests.</div>
          ) : (
            <div className="list-group">
              {user.tickets.map(t => (
                <div 
                  key={t.id} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelectedTicket(t)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.375rem', color: 'var(--accent)' }}>
                      {t.title}
                    </div>
                    <div className="text-xs text-muted" style={{ display: 'flex', gap: '0.5rem' }}>
                      <span>Opened {new Date(t.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{t.category}</span>
                    </div>
                  </div>
                  <div>
                    <span className={statusColor(t.status)}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedTicket(null)}>
          <div className="modal" style={{ width: '100%', maxWidth: '1000px', height: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
              <span className="modal-title">Ticket Details</span>
              <button className="modal-close" onClick={() => setSelectedTicket(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              {/* Standard layout works well enough */}
              <TicketDetailClient ticket={selectedTicket} isPortalView={true} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
