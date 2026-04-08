'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { updateUser, assignAsset, unassignAsset, swapDevice, grantAccess, revokeAccess } from '@/app/actions'
import type { User, Asset, AccessPoint, UserAccess, Log, UserAccount, Ticket } from '@prisma/client'
import { AccountsSection } from './AccountsSection'
import { TicketsSection } from './TicketsSection'

type FullUser = User & {
  assets: Asset[]
  accessPoints: (UserAccess & { accessPoint: AccessPoint })[]
  userAccounts: UserAccount[]
  tickets: Ticket[]
  logs: (Log & { asset: Asset })[]
}

function statusBadge(status: string) {
  const map: Record<string, string> = { Assigned: 'badge-green', 'In Stock': 'badge-blue', Broken: 'badge-red', Retired: 'badge-gray', 'Pending Return': 'badge-yellow' }
  return `badge ${map[status] ?? 'badge-gray'}`
}

function typeColor(type: string): string {
  const m: Record<string, string> = { Mailbox: 'badge-purple', Printer: 'badge-yellow', SharePoint: 'badge-green', FileServer: 'badge-blue' }
  return `badge ${m[type] ?? 'badge-gray'}`
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

export function UserProfileClient({ user, stockAssets, allAccessPoints, grantedIds }: {
  user: FullUser
  stockAssets: Asset[]
  allAccessPoints: AccessPoint[]
  grantedIds: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [swapTarget, setSwapTarget] = useState<Asset | null>(null)
  const [selectedSwap, setSelectedSwap] = useState('')
  const [accessOpen, setAccessOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedAssign, setSelectedAssign] = useState('')
  const initials = user.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()

  const DEPARTMENTS = ['IT', 'Front Desk', 'Accounting', 'Technical', 'Purchasing & Crew', 'Sales & PR', 'Customer Support', 'Operations', 'European Navigation', 'Management', 'Greek Office']
  const LICENSES = ['M365 BP', 'M365 E3', 'M365 F3', 'Teams Phone', 'M365 Business Basic']

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => { await updateUser(user.id, fd); router.refresh(); setEditOpen(false) })
  }

  const handleUnassign = (assetId: string) => {
    startTransition(async () => { await unassignAsset(assetId, 'In Stock'); router.refresh() })
  }

  const handleSwap = () => {
    if (!swapTarget || !selectedSwap) return
    startTransition(async () => { await swapDevice(swapTarget.id, selectedSwap, user.id); router.refresh(); setSwapTarget(null); setSelectedSwap('') })
  }

  const handleRevokeAccess = (accessPointId: string) => {
    startTransition(async () => { await revokeAccess(user.id, accessPointId); router.refresh() })
  }

  const handleGrantAccess = (accessPointId: string, checked: boolean) => {
    startTransition(async () => {
      if (checked) await grantAccess(user.id, accessPointId)
      else await revokeAccess(user.id, accessPointId)
      router.refresh()
    })
  }

  const handleAssignAsset = () => {
    if (!selectedAssign) return
    startTransition(async () => { await assignAsset(selectedAssign, user.id); router.refresh(); setAssignOpen(false); setSelectedAssign('') })
  }

  return (
    <div>
      {/* Edit User Modal */}
      {editOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditOpen(false)}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">Edit Employee</span><button className="modal-close" onClick={() => setEditOpen(false)}><CloseIcon /></button></div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Full Name <span>*</span></label>
                    <input name="name" className="form-input" required defaultValue={user.name} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select name="department" className="form-select" defaultValue={user.department ?? ''}>
                      <option value="">— Select —</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">License</label>
                    <select name="license" className="form-select" defaultValue={user.license ?? ''}>
                      <option value="">— Select —</option>
                      {LICENSES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Desk Extension</label>
                    <input name="deskExtension" className="form-input" defaultValue={user.deskExtension ?? ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role Code</label>
                    <input name="airportExtension" className="form-input" defaultValue={user.airportExtension ?? ''} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Mobile Number</label>
                    <input name="mobileNumber" className="form-input" defaultValue={user.mobileNumber ?? ''} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Swap Device Modal */}
      {swapTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSwapTarget(null)}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">Swap Device</span><button className="modal-close" onClick={() => setSwapTarget(null)}><CloseIcon /></button></div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                Returning: <strong>{swapTarget.category} — {swapTarget.brandModel.slice(0, 50)}</strong>. Its status will change to <strong>Pending Return</strong>.
              </div>
              <div className="form-group">
                <label className="form-label">Select Replacement Device (In Stock)</label>
                <select className="form-select" value={selectedSwap} onChange={e => setSelectedSwap(e.target.value)}>
                  <option value="">— Select asset —</option>
                  {stockAssets.filter(a => a.category === swapTarget.category).map(a => (
                    <option key={a.id} value={a.id}>{a.category}: {a.brandModel} {a.serialImei ? `(${a.serialImei})` : ''}</option>
                  ))}
                  {stockAssets.filter(a => a.category !== swapTarget.category).length > 0 && (
                    <>
                      <option disabled>── Other categories ──</option>
                      {stockAssets.filter(a => a.category !== swapTarget.category).map(a => (
                        <option key={a.id} value={a.id}>{a.category}: {a.brandModel} {a.serialImei ? `(${a.serialImei})` : ''}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSwapTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSwap} disabled={!selectedSwap || pending}>{pending ? 'Swapping…' : 'Confirm Swap'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Asset Modal */}
      {assignOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAssignOpen(false)}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">Assign Asset to {user.name}</span><button className="modal-close" onClick={() => setAssignOpen(false)}><CloseIcon /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Asset from Stock</label>
                <select className="form-select" value={selectedAssign} onChange={e => setSelectedAssign(e.target.value)}>
                  <option value="">— Select asset —</option>
                  {stockAssets.map(a => <option key={a.id} value={a.id}>{a.category}: {a.brandModel} {a.serialImei ? `(S/N: ${a.serialImei})` : '(Bulk)'}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAssignOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssignAsset} disabled={!selectedAssign || pending}>{pending ? 'Assigning…' : 'Assign Asset'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Access Modal */}
      {accessOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAccessOpen(false)}>
          <div className="modal modal-lg">
            <div className="modal-header"><span className="modal-title">Manage Access Rights — {user.name}</span><button className="modal-close" onClick={() => setAccessOpen(false)}><CloseIcon /></button></div>
            <div className="modal-body">
              <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>Toggle the checkboxes below to grant or revoke access. Changes apply instantly.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allAccessPoints.map(ap => {
                  const granted = grantedIds.includes(ap.id)
                  return (
                    <label key={ap.id} className={`check-item ${granted ? 'checked' : ''}`}>
                      <input type="checkbox" defaultChecked={granted} onChange={e => handleGrantAccess(ap.id, e.target.checked)} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ap.name}</div>
                        <div className="text-xs text-muted">{ap.type}{ap.description ? ` — ${ap.description}` : ''}</div>
                      </div>
                      <span className={typeColor(ap.type)} style={{ marginLeft: 'auto' }}>{ap.type}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setAccessOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Hero */}
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="profile-name">{user.name}</div>
          <div className="profile-role">{user.department ?? 'Department not set'}</div>
          <div className="profile-meta">
            {user.deskExtension && <div className="profile-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l1.27-.73a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 18v-.92z"/></svg>Ext. {user.deskExtension}</div>}
            {user.mobileNumber && <div className="profile-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>{user.mobileNumber}</div>}
            {user.license && <div className="profile-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span className="badge badge-blue">{user.license}</span></div>}
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => setEditOpen(true)}>Edit Profile</button>
          <button className="btn btn-secondary" onClick={() => setAssignOpen(true)}>Assign Asset</button>
          <button className="btn btn-primary" onClick={() => setAccessOpen(true)}>Manage Access</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
        <TicketsSection userId={user.id} tickets={user.tickets} assets={user.assets} />
        <AccountsSection userId={user.id} accounts={user.userAccounts} />
      </div>

      <div className="profile-grid">
        {/* Hardware Card */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Assigned Hardware</div>
            <span className="badge badge-gray">{user.assets.length}</span>
          </div>
          {user.assets.length === 0 ? (
            <div className="empty-state"><p>No hardware assigned</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Category</th><th>Serial</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {user.assets.map((a: Asset) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>{a.category}</div>
                      <div className="text-xs text-muted" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.brandModel}</div>
                    </td>
                    <td className="font-mono">{a.serialImei ?? '—'}</td>
                    <td><span className={statusBadge(a.status)}>{a.status}</span></td>
                    <td>
                      <div className="action-bar">
                        {a.type === 'Serialized' && a.status === 'Assigned' && <button className="btn btn-ghost btn-sm" onClick={() => setSwapTarget(a)} title="Swap device">↔</button>}
                        <button className="btn btn-danger btn-sm" onClick={() => handleUnassign(a.id)} disabled={pending}>Return</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Access Points Card */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Digital Access Rights</div>
            <span className="badge badge-gray">{user.accessPoints.length}</span>
          </div>
          {user.accessPoints.length === 0 ? (
            <div className="empty-state"><p>No access rights granted</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Resource</th><th>Type</th><th>Granted</th><th></th></tr></thead>
              <tbody>
                {user.accessPoints.map((ua: UserAccess & { accessPoint: AccessPoint }) => (
                  <tr key={ua.accessPointId}>
                    <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ua.accessPoint.name}</td>
                    <td><span className={typeColor(ua.accessPoint.type)}>{ua.accessPoint.type}</span></td>
                    <td className="text-xs text-muted">{new Date(ua.grantedAt).toLocaleDateString('en-GB')}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleRevokeAccess(ua.accessPointId)} disabled={pending}>Revoke</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="card card-p">
        <div className="section-title">Activity Log (Non-Editable)</div>
        {user.logs.length === 0 ? (
          <p className="text-sm text-muted">No activity recorded yet.</p>
        ) : (
          <div className="timeline">
            {user.logs.map((log: Log & { asset: Asset }, i: number) => {
              const isAssign = log.action.toLowerCase().includes('assign')
              const isReturn = log.action.toLowerCase().includes('return')
              return (
                <div key={log.id} className="timeline-item">
                  {i < user.logs.length - 1 && <div className="timeline-line" />}
                  <div className={`timeline-dot ${isAssign ? 'green' : isReturn ? 'yellow' : ''}`} />
                  <div className="timeline-content">
                    <div className="timeline-action">{log.action} — <span className="text-muted">{log.asset.category}: {log.asset.brandModel.slice(0, 50)}</span></div>
                    {log.notes && <div className="timeline-notes">{log.notes}</div>}
                    <div className="timeline-time">{new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
