'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTicket } from '@/app/actions'
import type { Ticket, Asset } from '@prisma/client'
import Link from 'next/link'

export function TicketsSection({ userId, tickets, assets }: { userId: string, tickets: Ticket[], assets: Asset[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.append('authorId', userId)
    startTransition(async () => {
      await createTicket(fd)
      setCreateOpen(false)
      router.refresh()
    })
  }

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

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
      {/* Create Ticket Modal */}
      {createOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setCreateOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Open Support Ticket</span>
              <button className="modal-close" onClick={() => setCreateOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Issue Title <span>*</span></label>
                  <input name="title" className="form-input" required placeholder="Brief summary of the issue" />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select name="category" className="form-select">
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Access">Access & Credentials</option>
                      <option value="Network">Network & VPN</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select name="priority" className="form-select" defaultValue="Medium">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Linked Hardware <span>(Optional)</span></label>
                  <select name="assetId" className="form-select">
                    <option value="">-- No specific hardware --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.category}: {a.brandModel} {a.serialImei ? `(S/N ${a.serialImei})` : ''}</option>
                    ))}
                  </select>
                  <div className="form-hint">Does this issue relate to a specific device assigned to this user?</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description <span>*</span></label>
                  <textarea name="description" className="form-textarea" required rows={4} placeholder="Describe the issue in detail..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Comment / Resolution Step</label>
                  <textarea name="comment" className="form-textarea" rows={2} placeholder="(Optional) Any immediate steps taken?" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? 'Opening...' : 'Open Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Support Tickets</div>
          <span className="badge badge-gray">{tickets.length}</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setCreateOpen(true)}>+ Open Ticket</button>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p style={{ fontSize: '0.875rem' }}>No support tickets have been opened for this user.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Category</th>
              <th>Title</th>
              <th>Last Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id}>
                <td className="font-mono text-xs text-muted">...{t.id.slice(-6)}</td>
                <td><span className={statusColor(t.status)}>{t.status}</span></td>
                <td className="text-sm">{t.category}</td>
                <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{t.title}</td>
                <td className="text-xs text-muted">{new Date(t.updatedAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/tickets/${t.id}`} className="btn btn-secondary btn-sm">View Thread</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
