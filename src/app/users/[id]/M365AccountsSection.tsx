'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { M365Account } from '@prisma/client'
import { assignM365Account, unassignM365Account, updateM365AccountUsage } from '@/app/actions'

interface M365AccountsSectionProps {
  userId: string
  accounts: M365Account[]
  availableAccounts: M365Account[]
}

export function M365AccountsSection({ userId, accounts, availableAccounts }: M365AccountsSectionProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [assignOpen, setAssignOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  
  const [selectedAssign, setSelectedAssign] = useState('')
  const [usageType, setUsageType] = useState('')

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssign) return
    startTransition(async () => {
      await assignM365Account(selectedAssign, userId, usageType)
      router.refresh()
      setAssignOpen(false)
      setSelectedAssign('')
      setUsageType('')
    })
  }

  const handleUnassign = (accountId: string) => {
    if (!confirm('Unlink this M365 Account from the user?')) return
    startTransition(async () => {
      await unassignM365Account(accountId)
      router.refresh()
    })
  }

  const handleUpdateUsage = (accountId: string, usage: string) => {
    startTransition(async () => {
      await updateM365AccountUsage(accountId, usage)
      setEditOpen(null)
      router.refresh()
    })
  }

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
      {/* Assign Modal */}
      {assignOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAssignOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Link M365 Account</span>
              <button className="modal-close" onClick={() => setAssignOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Available Accounts Directory</label>
                  <select className="form-select" value={selectedAssign} onChange={e => setSelectedAssign(e.target.value)} required>
                    <option value="">— Select Account —</option>
                    {availableAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.displayName} ({a.email})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Usage / Type (Optional)</label>
                  <input type="text" className="form-input" placeholder="e.g. Primary Email, Shared Sales Inbox" value={usageType} onChange={e => setUsageType(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAssignOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={pending || !selectedAssign}>
                  {pending ? 'Linking...' : 'Link Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Linked Microsoft 365 Accounts</div>
          <span className="badge badge-gray">{accounts.length}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAssignOpen(true)}>+ Link Account</button>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p style={{ fontSize: '0.875rem' }}>No M365 accounts linked yet.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Account Details</th>
              <th>Usage / Notes</th>
              <th>Licenses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id}>
                <td>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{acc.displayName}</div>
                  <div className="text-xs font-mono">{acc.email}</div>
                  {acc.tenantName && <div className="text-xs text-muted">Tenant: {acc.tenantName}</div>}
                </td>
                <td>
                  {editOpen === acc.id ? (
                    <input 
                      autoFocus
                      type="text" 
                      className="form-input form-sm" 
                      defaultValue={acc.usageType || ''}
                      onBlur={(e) => handleUpdateUsage(acc.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateUsage(acc.id, e.currentTarget.value)}
                    />
                  ) : (
                    <span onClick={() => setEditOpen(acc.id)} style={{ cursor: 'pointer', borderBottom: '1px dashed #ccc' }}>
                      {acc.usageType || 'Click to add notes'}
                    </span>
                  )}
                </td>
                <td>
                  {acc.licenses ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {acc.licenses.split(',').map((l: string) => <span key={l} className="badge badge-blue">{l.trim()}</span>)}
                    </div>
                  ) : <span className="text-muted">—</span>}
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleUnassign(acc.id)} disabled={pending}>Unlink</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
