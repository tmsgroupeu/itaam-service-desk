'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/app/actions'
import type { User, Asset, AccessPoint, M365Account } from '@prisma/client'
import { UserModal } from '@/app/users/UsersClient'

const STEPS = ['Select Employee', 'Assign Hardware', 'Link Accounts', 'Grant Access', 'Confirm & Complete']

function typeColor(t: string) {
  const m: Record<string, string> = { Mailbox: 'badge-purple', Printer: 'badge-yellow', SharePoint: 'badge-green', FileServer: 'badge-blue' }
  return `badge ${m[t] ?? 'badge-gray'}`
}

export function OnboardWizard({ users, stockAssets, accessPoints, availableM365Accounts }: {
  users: User[]
  stockAssets: Asset[]
  accessPoints: AccessPoint[]
  availableM365Accounts: M365Account[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedAccess, setSelectedAccess] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)

  const user = users.find(u => u.id === selectedUser)

  const groupedStockAssets = useMemo(() => {
    const bulkMap: Record<string, { asset: Asset; ids: string[]; count: number }> = {}
    const serialized: Asset[] = []

    for (const a of stockAssets) {
      if (a.type === 'Bulk') {
        const key = `${a.category}-${a.brandModel}`
        if (!bulkMap[key]) {
          bulkMap[key] = { asset: a, ids: [a.id], count: 1 }
        } else {
          bulkMap[key].ids.push(a.id)
          bulkMap[key].count++
        }
      } else {
        serialized.push(a)
      }
    }
    return { bulkMap, serialized }
  }, [stockAssets])

  const toggleAsset = (id: string) => setSelectedAssets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAccount = (id: string) => setSelectedAccounts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAccess = (id: string) => setSelectedAccess(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleComplete = () => {
    startTransition(async () => {
      await completeOnboarding(selectedUser, selectedAssets, selectedAccess, selectedAccounts)
      setDone(true)
    })
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Onboarding Complete!</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          <strong>{user?.name}</strong> has been onboarded with {selectedAssets.length} hardware item{selectedAssets.length !== 1 ? 's' : ''}, {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''}, and {selectedAccess.length} access right{selectedAccess.length !== 1 ? 's' : ''}.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href={`/users/${selectedUser}`} className="btn btn-primary">View Employee Profile</a>
          <button className="btn btn-secondary" onClick={() => { setStep(0); setSelectedUser(''); setSelectedAssets([]); setSelectedAccounts([]); setSelectedAccess([]); setDone(false) }}>Start Another Onboarding</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {showAddUser && <UserModal onClose={() => setShowAddUser(false)} />}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Employee Onboarding</h1>
        <p className="text-muted text-sm">Complete all steps to assign hardware and grant digital access to a new employee.</p>
      </div>

      {/* Wizard Steps */}
      <div className="wizard-steps" style={{ marginBottom: '2rem' }}>
        {STEPS.map((s, i) => (
          <div key={s} className={`wizard-step-item ${i === step ? 'active' : i < step ? 'done' : ''}`}>
            <div className="wizard-step-num">{i < step ? '✓' : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="card card-p" style={{ minHeight: '320px' }}>
        {/* Step 0: Select Employee */}
        {step === 0 && (
          <div>
            <div className="section-title">Select Employee to Onboard</div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>Choose an existing employee from the directory, or add a new one first.</p>
            <div className="form-group" style={{ maxWidth: '420px' }}>
              <label className="form-label">Employee</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select className="form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                  <option value="">— Select employee —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.department ?? 'No dept'}</option>)}
                </select>
                <button className="btn btn-secondary" onClick={() => setShowAddUser(true)} title="Add New Employee">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            </div>
            {selectedUser && user && (
              <div className="alert alert-info" style={{ maxWidth: '420px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>Onboarding <strong>{user.name}</strong> · {user.department}</div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Assign Hardware */}
        {step === 1 && (
          <div>
            <div className="section-title">Assign Hardware to {user?.name}</div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>Select equipment from stock to assign. {stockAssets.length === 0 && <strong>No items currently in stock.</strong>}</p>
            <div className="check-list">
              {stockAssets.length === 0 ? (
                <div className="empty-state" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '2rem' }}>
                  <p>No assets in stock. Add assets via Hardware Inventory first.</p>
                </div>
              ) : (
                <>
                  {Object.values(groupedStockAssets.bulkMap).map(group => {
                    const a = group.asset
                    const selectedId = selectedAssets.find(id => group.ids.includes(id))
                    const isChecked = !!selectedId
                    
                    return (
                      <label key={a.id} className={`check-item ${isChecked ? 'checked' : ''}`} onClick={(e) => {
                        e.preventDefault()
                        if (isChecked && selectedId) {
                          setSelectedAssets(prev => prev.filter(x => x !== selectedId))
                        } else {
                          setSelectedAssets(prev => [...prev, group.ids[0]])
                        }
                      }}>
                        <input type="checkbox" readOnly checked={isChecked} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.category}: {a.brandModel} <span className="text-muted">({group.count} in stock)</span></div>
                        </div>
                        <span className="badge badge-purple">Bulk Item</span>
                      </label>
                    )
                  })}
                  {groupedStockAssets.serialized.map(a => (
                    <label key={a.id} className={`check-item ${selectedAssets.includes(a.id) ? 'checked' : ''}`} onClick={(e) => {
                      e.preventDefault()
                      toggleAsset(a.id)
                    }}>
                      <input type="checkbox" readOnly checked={selectedAssets.includes(a.id)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.category}: {a.brandModel}</div>
                        {a.serialImei && <div className="font-mono text-xs text-muted">S/N: {a.serialImei}</div>}
                        {a.conditionComment && <div className="text-xs text-muted">{a.conditionComment}</div>}
                      </div>
                      <span className="badge badge-blue">{a.type}</span>
                    </label>
                  ))}
                </>
              )}
            </div>
            {selectedAssets.length > 0 && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                {selectedAssets.length} item{selectedAssets.length !== 1 ? 's' : ''} selected for assignment.
              </div>
            )}
          </div>
        )}

        {/* Step 2: Link Accounts */}
        {step === 2 && (
          <div>
            <div className="section-title">Link M365 Accounts to {user?.name}</div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>Select existing mailboxes to link. {availableM365Accounts.length === 0 && <strong>No unassigned accounts.</strong>}</p>
            <div className="check-list">
              {availableM365Accounts.map(a => (
                <label key={a.id} className={`check-item ${selectedAccounts.includes(a.id) ? 'checked' : ''}`} onClick={() => toggleAccount(a.id)}>
                  <input type="checkbox" readOnly checked={selectedAccounts.includes(a.id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.displayName}</div>
                    <div className="font-mono text-xs text-muted">{a.email}</div>
                  </div>
                  {a.licenses && <span className="badge badge-purple">{a.licenses.split(',')[0]}</span>}
                </label>
              ))}
              {availableM365Accounts.length === 0 && <div className="empty-state" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '2rem' }}><p>No unassigned accounts in M365 Directory.</p></div>}
            </div>
          </div>
        )}

        {/* Step 3: Grant Access */}
        {step === 3 && (
          <div>
            <div className="section-title">Grant Digital Access to {user?.name}</div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>Select which printers, and shared resources this employee needs.</p>
            <div className="check-list">
              {accessPoints.map(ap => (
                <label key={ap.id} className={`check-item ${selectedAccess.includes(ap.id) ? 'checked' : ''}`} onClick={() => toggleAccess(ap.id)}>
                  <input type="checkbox" readOnly checked={selectedAccess.includes(ap.id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ap.name}</div>
                    {ap.description && <div className="text-xs text-muted">{ap.description}</div>}
                  </div>
                  <span className={typeColor(ap.type)}>{ap.type}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && user && (
          <div>
            <div className="section-title">Review & Confirm Onboarding</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div className="section-title" style={{ marginBottom: '0.5rem' }}>Employee</div>
                <div style={{ fontWeight: 600 }}>{user.name}</div>
                <div className="text-sm text-muted">{user.department} · Ext. {user.deskExtension ?? '—'}</div>
              </div>
              <div>
                <div className="section-title" style={{ marginBottom: '0.5rem' }}>Hardware ({selectedAssets.length} items)</div>
                {selectedAssets.length === 0 ? <div className="text-sm text-muted">None selected</div> : stockAssets.filter(a => selectedAssets.includes(a.id)).map(a => (
                  <div key={a.id} className="text-sm">{a.category}: {a.brandModel.slice(0, 40)}</div>
                ))}
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <div className="section-title" style={{ marginBottom: '0.5rem' }}>M365 Accounts ({selectedAccounts.length} selected)</div>
                  {selectedAccounts.length === 0 ? <div className="text-sm text-muted">None selected</div> : availableM365Accounts.filter(a => selectedAccounts.includes(a.id)).map(a => (
                    <div key={a.id} className="text-sm">{a.email}</div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="section-title" style={{ marginBottom: '0.5rem' }}>Access Rights ({selectedAccess.length} endpoints)</div>
                  {selectedAccess.length === 0 ? <div className="text-sm text-muted">None selected</div> : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {accessPoints.filter(ap => selectedAccess.includes(ap.id)).map(ap => (
                        <span key={ap.id} className={typeColor(ap.type)}>{ap.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="alert alert-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>After confirming, all selected assets will be marked <strong>Assigned</strong> and all access rights will be granted immediately. An activity log entry will be created for each item.</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0}>← Back</button>
        {step < 4 ? (
          <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={step === 0 && !selectedUser}>
            Continue →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleComplete} disabled={pending || !selectedUser}>
            {pending ? 'Processing…' : '✓ Complete Onboarding'}
          </button>
        )}
      </div>
    </div>
  )
}
