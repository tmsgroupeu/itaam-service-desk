'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { M365Account, UserAccount } from '@prisma/client'
import { assignM365Account, unassignM365Account, updateM365AccountUsage, createUserAccount, updateUserAccount, deleteUserAccount } from '@/app/actions'

const ACCOUNT_TYPES = ['Corporate Email', 'Teams', 'VPN', 'Office Activation', 'Secondary Email', 'Other']

function typeBadge(t: string) {
  const map: Record<string, string> = { 'Corporate Email': 'badge-blue', Teams: 'badge-purple', VPN: 'badge-red', 'Office Activation': 'badge-green', 'Secondary Email': 'badge-gray', Other: 'badge-gray' }
  return `badge ${map[t] ?? 'badge-gray'}`
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

interface UnifiedAccountsSectionProps {
  userId: string
  m365Accounts: M365Account[]
  userAccounts: UserAccount[]
  availableM365Accounts: M365Account[]
}

export function UnifiedAccountsSection({ userId, m365Accounts, userAccounts, availableM365Accounts }: UnifiedAccountsSectionProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  
  // Modals
  const [addMode, setAddMode] = useState<'m365' | 'custom' | null>(null)
  const [editCustomAccount, setEditCustomAccount] = useState<UserAccount | null>(null)
  
  // Inline editing for M365
  const [editM365Id, setEditM365Id] = useState<string | null>(null)

  // Combined Accounts List
  const allAccounts = [
    ...m365Accounts.map(a => ({ type: 'm365' as const, id: a.id, data: a })),
    ...userAccounts.map(a => ({ type: 'custom' as const, id: a.id, data: a }))
  ]

  // M365 Handlers
  const handleAssignM365 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const accountId = fd.get('accountId') as string
    const usageType = fd.get('usageType') as string
    startTransition(async () => {
      await assignM365Account(accountId, userId, usageType)
      router.refresh()
      setAddMode(null)
    })
  }

  const handleUnassignM365 = (accountId: string) => {
    if (!confirm('Unlink this M365 Account from the user?')) return
    startTransition(async () => {
      await unassignM365Account(accountId)
      router.refresh()
    })
  }

  const handleUpdateM365Usage = (accountId: string, usage: string) => {
    startTransition(async () => {
      await updateM365AccountUsage(accountId, usage)
      setEditM365Id(null)
      router.refresh()
    })
  }

  // Custom Account Handlers
  const handleSaveCustom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      if (editCustomAccount) await updateUserAccount(editCustomAccount.id, userId, fd)
      else await createUserAccount(userId, fd)
      router.refresh()
      setAddMode(null)
      setEditCustomAccount(null)
    })
  }

  const handleDeleteCustom = (accountId: string) => {
    if (!confirm('Delete this account record?')) return
    startTransition(async () => {
      await deleteUserAccount(accountId, userId)
      router.refresh()
    })
  }

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
      
      {/* ADD / EDIT M365 MODAL */}
      {addMode === 'm365' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddMode(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Link Microsoft 365 Account</span>
              <button className="modal-close" type="button" onClick={() => setAddMode(null)}><CloseIcon /></button>
            </div>
            <form onSubmit={handleAssignM365}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Available Accounts Directory</label>
                  <select name="accountId" className="form-select" required>
                    <option value="">— Select Account —</option>
                    {availableM365Accounts.map(a => <option key={a.id} value={a.id}>{a.displayName} ({a.email})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Usage / Type (Optional)</label>
                  <input name="usageType" type="text" className="form-input" placeholder="e.g. Primary Email, Shared Sales Inbox" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddMode(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Linking...' : 'Link Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOM MODAL */}
      {(addMode === 'custom' || editCustomAccount) && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && (setAddMode(null), setEditCustomAccount(null))}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editCustomAccount ? 'Edit Account Record' : 'Add Custom Account'}</span>
              <button className="modal-close" type="button" onClick={() => { setAddMode(null); setEditCustomAccount(null) }}><CloseIcon /></button>
            </div>
            <form onSubmit={handleSaveCustom}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Account Type <span style={{ color: 'var(--red)' }}>*</span></label>
                  <select name="accountType" className="form-select" defaultValue={editCustomAccount?.accountType ?? 'VPN'} required>
                    {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Username / Account ID <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input name="username" className="form-input" required defaultValue={editCustomAccount?.username ?? ''} placeholder="e.g. VPN-profile-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea name="notes" className="form-textarea" defaultValue={editCustomAccount?.notes ?? ''} placeholder="e.g. FortiClient VPN profile..." rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setAddMode(null); setEditCustomAccount(null) }} disabled={pending}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Digital Accounts</div>
          <span className="badge badge-gray">{allAccounts.length}</span>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary btn-sm" onClick={() => setAddMode('custom')}>+ Add Custom Account</button>
          <button className="btn btn-primary btn-sm" onClick={() => setAddMode('m365')}>+ Link M365 Account</button>
        </div>
      </div>

      {allAccounts.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p style={{ fontSize: '0.875rem' }}>No accounts connected yet.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Account Details</th>
              <th>Usage / Notes</th>
              <th>Licenses / Meta</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allAccounts.map(item => {
              if (item.type === 'm365') {
                const acc = item.data as M365Account
                return (
                  <tr key={acc.id} style={{ backgroundColor: 'rgba(59, 130, 246, 0.02)' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-blue">M365</span>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{acc.displayName}</div>
                      </div>
                      <div className="text-xs font-mono" style={{ marginTop: '0.25rem' }}>{acc.email}</div>
                    </td>
                    <td>
                      {editM365Id === acc.id ? (
                        <input 
                          autoFocus
                          type="text" 
                          className="form-input form-sm" 
                          defaultValue={acc.usageType || ''}
                          onBlur={(e) => handleUpdateM365Usage(acc.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateM365Usage(acc.id, e.currentTarget.value)}
                        />
                      ) : (
                        <span onClick={() => setEditM365Id(acc.id)} style={{ cursor: 'pointer', borderBottom: '1px dashed var(--border)' }}>
                          {acc.usageType || 'Click to set usage type'}
                        </span>
                      )}
                    </td>
                    <td>
                      {acc.licenses ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {acc.licenses.split(',').map((l: string) => <span key={l} className="badge badge-gray">{l.trim()}</span>)}
                        </div>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleUnassignM365(acc.id)} disabled={pending}>Unlink</button>
                    </td>
                  </tr>
                )
              } else {
                const acc = item.data as UserAccount
                return (
                  <tr key={acc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={typeBadge(acc.accountType)}>{acc.accountType}</span>
                        <div className="font-mono text-sm">{acc.username}</div>
                      </div>
                    </td>
                    <td className="text-sm text-muted" style={{ maxWidth: '220px' }}>{acc.notes || '—'}</td>
                    <td className="text-xs text-muted">Created: {new Date(acc.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <div className="action-bar">
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditCustomAccount(acc)}>Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDeleteCustom(acc.id)} disabled={pending}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              }
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
