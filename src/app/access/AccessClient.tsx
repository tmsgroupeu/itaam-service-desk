'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { createAccessPoint, deleteAccessPoint, grantAccess, revokeAccess } from '@/app/actions'
import type { AccessPoint, User, UserAccess } from '@prisma/client'

type APRow = AccessPoint & { users: (UserAccess & { user: User })[] }

function typeColor(t: string) {
  const m: Record<string, string> = { Mailbox: 'badge-purple', Printer: 'badge-yellow', SharePoint: 'badge-green', FileServer: 'badge-blue' }
  if (m[t]) return `badge ${m[t]}`
  
  const colors = ['badge-blue', 'badge-green', 'badge-purple', 'badge-yellow', 'badge-gray']
  let hash = 0
  for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash)
  return `badge ${colors[Math.abs(hash) % colors.length]}`
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

function AddAPModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => { await createAccessPoint(fd); router.refresh(); onClose() })
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><span className="modal-title">Add Access Endpoint</span><button className="modal-close" onClick={onClose}><CloseIcon /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Endpoint Name <span style={{ color: 'var(--red)' }}>*</span></label>
              <input name="name" className="form-input" required placeholder="e.g. invoices@company.com or HR SharePoint" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <input name="type" className="form-input" list="typeList" required placeholder="e.g. Platform, VPN, Server, License" />
              <datalist id="typeList">
                <option value="Mailbox" />
                <option value="Printer" />
                <option value="SharePoint" />
                <option value="FileServer" />
                <option value="Platform Access" />
                <option value="Local App" />
                <option value="VPN" />
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Description / IP / Path</label>
              <input name="description" className="form-input" placeholder="e.g. IP: 192.168.1.178 or \\fileserver\HR" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Creating…' : 'Create Endpoint'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AuditModal({ ap, allUsers, onClose }: { ap: APRow; allUsers: User[]; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const grantedIds = ap.users.map(ua => ua.userId)

  const toggle = (userId: string, granted: boolean) => {
    startTransition(async () => {
      if (granted) await revokeAccess(userId, ap.id)
      else await grantAccess(userId, ap.id)
      router.refresh()
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-title">{ap.name}</div>
            <div className="text-xs text-muted">{ap.type}{ap.description ? ` — ${ap.description}` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-danger btn-sm" onClick={() => {
              if (!confirm(`Delete "${ap.name}" and revoke all access?`)) return
              startTransition(async () => { await deleteAccessPoint(ap.id); router.refresh(); onClose() })
            }} disabled={pending}>Delete Endpoint</button>
            <button className="modal-close" onClick={onClose}><CloseIcon /></button>
          </div>
        </div>
        <div className="modal-body">
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>Toggle access for each employee. Currently <strong>{grantedIds.length}</strong> users have access.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {allUsers.map(u => {
              const granted = grantedIds.includes(u.id)
              return (
                <label key={u.id} className={`check-item ${granted ? 'checked' : ''}`}>
                  <input type="checkbox" defaultChecked={granted} onChange={() => toggle(u.id, granted)} disabled={pending} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{u.name}</div>
                    <div className="text-xs text-muted">{u.department ?? 'No department'}</div>
                  </div>
                  {granted && <span className="badge badge-green">Access granted</span>}
                </label>
              )
            })}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

export function AccessClient({ accessPoints, allUsers }: { accessPoints: APRow[]; allUsers: User[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [auditAP, setAuditAP] = useState<APRow | null>(null)

  return (
    <>
      {addOpen && <AddAPModal onClose={() => setAddOpen(false)} />}
      {auditAP && <AuditModal ap={auditAP} allUsers={allUsers} onClose={() => setAuditAP(null)} />}

      <div className="page-header">
        <h1 className="page-title">Digital Access Matrix</h1>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>+ Add Endpoint</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Endpoint / Resource</th><th>Type</th><th>Description / IP</th><th>Users with Access</th><th>Actions</th></tr></thead>
          <tbody>
            {accessPoints.map(ap => (
              <tr key={ap.id}>
                <td style={{ fontWeight: 500 }}>{ap.name}</td>
                <td><span className={typeColor(ap.type)}>{ap.type}</span></td>
                <td className="text-sm text-muted">{ap.description ?? '—'}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {ap.users.slice(0, 3).map(ua => (
                      <a key={ua.userId} href={`/users/${ua.userId}`} style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>
                        {ua.user.name.split(' ')[0]}
                      </a>
                    ))}
                    {ap.users.length > 3 && <span className="text-xs text-muted">+{ap.users.length - 3} more</span>}
                    {ap.users.length === 0 && <span className="text-xs text-muted">No users</span>}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: '0.125rem' }}>{ap.users.length} total</div>
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => setAuditAP(ap)}>
                    Audit &amp; Manage
                  </button>
                </td>
              </tr>
            ))}
            {accessPoints.length === 0 && <tr><td colSpan={5} className="table-empty">No access endpoints configured yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
