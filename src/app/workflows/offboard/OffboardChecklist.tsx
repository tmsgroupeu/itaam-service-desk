'use client'

import { useState, useTransition } from 'react'
import { completeOffboarding } from '@/app/actions'
import type { User, Asset, AccessPoint, UserAccess } from '@prisma/client'

type UserWithAll = User & {
  assets: Asset[]
  accessPoints: (UserAccess & { accessPoint: AccessPoint })[]
}

function typeColor(t: string) {
  const m: Record<string, string> = { Mailbox: 'badge-purple', Printer: 'badge-yellow', SharePoint: 'badge-green', FileServer: 'badge-blue' }
  return `badge ${m[t] ?? 'badge-gray'}`
}

export function OffboardChecklist({ users }: { users: UserWithAll[] }) {
  const [pending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState('')
  const [hardwareChecked, setHardwareChecked] = useState<string[]>([])
  const [accessChecked, setAccessChecked] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const user = users.find(u => u.id === selectedId)

  const toggleHardware = (id: string) => setHardwareChecked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleAccess = (id: string) => setAccessChecked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleUserSelect = (id: string) => {
    setSelectedId(id)
    setHardwareChecked([])
    setAccessChecked([])
    setDone(false)
  }

  const allHardwareChecked = user ? hardwareChecked.length === user.assets.length : false
  const allAccessChecked = user ? accessChecked.length === user.accessPoints.length : false
  const canComplete = user && allHardwareChecked && allAccessChecked

  const handleComplete = () => {
    if (!user) return
    startTransition(async () => {
      await completeOffboarding(user.id)
      setDone(true)
    })
  }

  if (done && user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Offboarding Complete</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          <strong>{user.name}</strong> has been fully offboarded. All hardware has been returned to stock and all access rights have been revoked.
        </p>
        <button className="btn btn-secondary" onClick={() => { setSelectedId(''); setDone(false); setHardwareChecked([]); setAccessChecked([]) }}>
          Offboard Another Employee
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Employee Offboarding</h1>
        <p className="text-muted text-sm">Select an employee and check off every item to confirm hardware return and access revocation before completing offboarding.</p>
      </div>

      <div className="card card-p" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ maxWidth: '420px', marginBottom: 0 }}>
          <label className="form-label">Select Employee to Offboard</label>
          <select className="form-select" value={selectedId} onChange={e => handleUserSelect(e.target.value)}>
            <option value="">— Select employee —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.department ?? 'No dept'} ({u.assets.length} assets, {u.accessPoints.length} access)</option>)}
          </select>
        </div>
      </div>

      {user && (
        <>
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>You are offboarding <strong>{user.name}</strong> ({user.department}). This will return all hardware to stock and permanently revoke all digital access. Check off every item to confirm.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Hardware Return */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Hardware to Return</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${allHardwareChecked ? 'badge-green' : 'badge-gray'}`}>{hardwareChecked.length}/{user.assets.length}</span>
                  {user.assets.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setHardwareChecked(user.assets.map(a => a.id))}>Check all</button>}
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                {user.assets.length === 0 ? (
                  <div className="empty-state"><p style={{ color: 'var(--green)' }}>✓ No hardware assigned</p></div>
                ) : (
                  <div className="check-list">
                    {user.assets.map(a => (
                      <label key={a.id} className={`check-item ${hardwareChecked.includes(a.id) ? 'checked' : ''}`} onClick={() => toggleHardware(a.id)}>
                        <input type="checkbox" readOnly checked={hardwareChecked.includes(a.id)} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.category}: {a.brandModel.slice(0, 45)}</div>
                          {a.serialImei && <div className="font-mono text-xs text-muted">S/N: {a.serialImei}</div>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Access Revocation */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Access to Revoke</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${allAccessChecked ? 'badge-green' : 'badge-gray'}`}>{accessChecked.length}/{user.accessPoints.length}</span>
                  {user.accessPoints.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setAccessChecked(user.accessPoints.map(ua => ua.accessPointId))}>Check all</button>}
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                {user.accessPoints.length === 0 ? (
                  <div className="empty-state"><p style={{ color: 'var(--green)' }}>✓ No access rights granted</p></div>
                ) : (
                  <div className="check-list">
                    {user.accessPoints.map(ua => (
                      <label key={ua.accessPointId} className={`check-item ${accessChecked.includes(ua.accessPointId) ? 'checked' : ''}`} onClick={() => toggleAccess(ua.accessPointId)}>
                        <input type="checkbox" readOnly checked={accessChecked.includes(ua.accessPointId)} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ua.accessPoint.name}</div>
                          <div className="text-xs text-muted">{ua.accessPoint.type}</div>
                        </div>
                        <span className={typeColor(ua.accessPoint.type)}>{ua.accessPoint.type}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!canComplete && (
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>Please check off all hardware items and access rights above before completing offboarding.</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-danger"
              onClick={handleComplete}
              disabled={!canComplete || pending}
              style={{ padding: '0.625rem 1.5rem', fontSize: '0.9rem' }}
            >
              {pending ? 'Processing…' : '⚠ Complete Offboarding'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
