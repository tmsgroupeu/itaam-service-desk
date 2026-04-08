'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createUserAccount, updateUserAccount, deleteUserAccount } from '@/app/actions'
import type { UserAccount } from '@prisma/client'

const ACCOUNT_TYPES = [
  'Corporate Email',
  'Teams',
  'VPN',
  'Office Activation',
  'Secondary Email',
  'Other',
]

// Badge color per type
function typeBadge(t: string) {
  const map: Record<string, string> = {
    'Corporate Email': 'badge-blue',
    Teams: 'badge-purple',
    VPN: 'badge-red',
    'Office Activation': 'badge-green',
    'Secondary Email': 'badge-gray',
    Other: 'badge-gray',
  }
  return `badge ${map[t] ?? 'badge-gray'}`
}

// Small icon per account type
function TypeIcon({ type }: { type: string }) {
  if (type === 'Corporate Email' || type === 'Secondary Email')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  if (type === 'Teams')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  if (type === 'VPN')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  if (type === 'Office Activation')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

interface AccountModalProps {
  userId: string
  account?: UserAccount
  onClose: () => void
}

function AccountModal({ userId, account, onClose }: AccountModalProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (account) await updateUserAccount(account.id, userId, fd)
        else await createUserAccount(userId, fd)
        router.refresh()
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{account ? 'Edit Account Record' : 'Add Account Record'}</span>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">Account Type <span style={{ color: 'var(--red)' }}>*</span></label>
              <select name="accountType" className="form-select" defaultValue={account?.accountType ?? 'Corporate Email'} required>
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="form-hint">e.g. Corporate Email = their primary M365/AD login. VPN = their VPN client username.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Username / Email / Account ID <span style={{ color: 'var(--red)' }}>*</span></label>
              <input
                name="username"
                className="form-input"
                required
                defaultValue={account?.username ?? ''}
                placeholder="e.g. m.michaill@company.com or VPN-profile-001"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                className="form-textarea"
                defaultValue={account?.notes ?? ''}
                placeholder="e.g. Office 365 activation key on file, FortiClient VPN profile, Teams direct line +357..."
                rows={3}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Saving…' : account ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface AccountsSectionProps {
  userId: string
  accounts: UserAccount[]
}

export function AccountsSection({ userId, accounts }: AccountsSectionProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<UserAccount | null>(null)

  const handleDelete = (accountId: string) => {
    if (!confirm('Delete this account record?')) return
    startTransition(async () => {
      await deleteUserAccount(accountId, userId)
      router.refresh()
    })
  }

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
      {addOpen && <AccountModal userId={userId} onClose={() => setAddOpen(false)} />}
      {editAccount && <AccountModal userId={userId} account={editAccount} onClose={() => setEditAccount(null)} />}

      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Account Records</div>
          <span className="badge badge-gray">{accounts.length}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>+ Add Account</button>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <p style={{ fontSize: '0.875rem' }}>No account records yet.</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>Track corporate emails, Teams, VPN, Office Activation, and other accounts.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Username / Email / Account ID</th>
              <th>Notes</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--foreground-muted)' }}><TypeIcon type={acc.accountType} /></span>
                    <span className={typeBadge(acc.accountType)}>{acc.accountType}</span>
                  </div>
                </td>
                <td>
                  <span className="font-mono" style={{ fontSize: '0.85rem' }}>{acc.username}</span>
                </td>
                <td className="text-sm text-muted" style={{ maxWidth: '220px' }}>{acc.notes ?? '—'}</td>
                <td className="text-xs text-muted">{new Date(acc.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  <div className="action-bar">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditAccount(acc)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(acc.id)} disabled={pending}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
