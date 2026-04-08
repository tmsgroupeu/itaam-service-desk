'use client'

import { useState } from 'react'
import type { Ticket, User, TicketComment } from '@prisma/client'
import Link from 'next/link'

type TicketRow = Ticket & { author: User; comments: TicketComment[] }

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

function priorityColor(priority: string) {
  const m: Record<string, string> = {
    Low: 'color: var(--foreground-muted)',
    Medium: 'color: var(--blue)',
    High: 'color: var(--yellow)',
    Critical: 'color: var(--red); font-weight: 600',
  }
  return m[priority] ?? ''
}

export function TicketsClient({ tickets }: { tickets: TicketRow[] }) {
  const [statusFilter, setStatusFilter] = useState('Active')

  // Derived filter logic
  const filtered = tickets.filter(t => {
    if (statusFilter === 'Active') return t.status !== 'Resolved' && t.status !== 'Closed'
    if (statusFilter === 'All') return true
    return t.status === statusFilter
  })

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Service Desk</h1>
        <div className="btn-group">
          {/* Quick filter dropdown could go here in future */}
          <span>{filtered.length} tickets</span>
        </div>
      </div>

      <div className="tabs">
        {['Active', 'All', 'Open', 'In Progress', 'Waiting on User', 'Resolved', 'Closed'].map(s => (
          <button key={s} className={`tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Issue</th>
              <th>Requested By</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td className="font-mono text-xs text-muted">...{t.id.slice(-6)}</td>
                <td><span className={statusColor(t.status)}>{t.status}</span></td>
                <td><span style={{ fontSize: '0.85rem', ...Object.fromEntries(priorityColor(t.priority).split(';').filter(Boolean).map(s => s.split(':').map(x=>x.trim()))) }}>{t.priority}</span></td>
                <td>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{t.title}</div>
                  <div className="text-xs text-muted">{t.category} • {t.comments.length} comments</div>
                </td>
                <td className="text-sm">
                  <Link href={`/users/${t.authorId}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                    {t.author.name}
                  </Link>
                </td>
                <td className="text-xs text-muted">{new Date(t.updatedAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/tickets/${t.id}`} className="btn btn-secondary btn-sm">View Ticket</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="table-empty">No tickets match the "{statusFilter}" filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
