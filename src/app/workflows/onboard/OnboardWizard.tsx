'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding, createUser } from '@/app/actions'
import type { User, Asset, AccessPoint, M365Account } from '@prisma/client'

const STEPS = ['Employee Details', 'Accounts & Emails', 'Systems & Platforms', 'Equipment & Office Setup', 'Confirm & Complete']
const DEPARTMENTS = ['IT', 'Front Desk', 'Accounting', 'Technical', 'Purchasing & Crew', 'Sales & PR', 'Customer Support', 'Operations', 'European Navigation', 'Management', 'Greek Office']
const CATEGORIES = ['Laptop', 'Desktop', 'Monitor', 'Mobile', 'Phone Console', 'Printer', 'Keyboard', 'Mouse', 'Headset', 'Cable', 'Other']

function typeColor(t: string) {
  const m: Record<string, string> = { Mailbox: 'badge-purple', Printer: 'badge-yellow', SharePoint: 'badge-green', FileServer: 'badge-blue' }
  return `badge ${m[t] ?? 'badge-gray'}`
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
  
  // Step 1 State: User Creation / Selection
  const [isNewUser, setIsNewUser] = useState(true)
  const [newUser, setNewUser] = useState({
    name: '',
    department: '',
    mobileNumber: '',
    deskExtension: '',
    airportExtension: '',
  })
  const [selectedUser, setSelectedUser] = useState('')
  const [userSearch, setUserSearch] = useState('')

  // Step 2-4 State
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedAccess, setSelectedAccess] = useState<string[]>([])
  
  // On-the-fly Asset Creation State
  const [newAssets, setNewAssets] = useState<Array<{
    tempId: string
    type: string
    category: string
    brandModel: string
    serialImei?: string
    conditionComment?: string
  }>>([])
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)
  
  const [accountSearch, setAccountSearch] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Existing user details
  const existingUser = users.find(u => u.id === selectedUser)
  const employeeName = isNewUser ? newUser.name : (existingUser?.name ?? '')

  // Filter existing users
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase()))
    )
  }, [users, userSearch])

  // Filter unassigned M365 accounts
  const filteredM365 = useMemo(() => {
    return availableM365Accounts.filter(a => 
      a.displayName.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.email.toLowerCase().includes(accountSearch.toLowerCase())
    )
  }, [availableM365Accounts, accountSearch])

  // Grouped Stock Assets for Hardware setup
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

  // Access points grouping
  const mailboxes = accessPoints.filter(ap => ap.type === 'Mailbox')
  const systems = accessPoints.filter(ap => ap.type !== 'Mailbox' && ap.type !== 'Printer')
  const printers = accessPoints.filter(ap => ap.type === 'Printer')

  const toggleAsset = (id: string) => setSelectedAssets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAccount = (id: string) => setSelectedAccounts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAccess = (id: string) => setSelectedAccess(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleComplete = () => {
    setError('')
    startTransition(async () => {
      try {
        let userId = selectedUser
        if (isNewUser) {
          const fd = new FormData()
          fd.append('name', newUser.name.trim())
          fd.append('department', newUser.department)
          fd.append('mobileNumber', newUser.mobileNumber.trim())
          fd.append('deskExtension', newUser.deskExtension.trim())
          fd.append('airportExtension', newUser.airportExtension.trim())

          const res = await createUser(fd)
          if (!res.success || !res.userId) {
            throw new Error('Failed to create employee profile')
          }
          userId = res.userId
        }

        const formattedNewAssets = newAssets.map(a => ({
          type: a.type,
          category: a.category,
          brandModel: a.brandModel,
          serialImei: a.serialImei,
          conditionComment: a.conditionComment
        }))

        await completeOnboarding(userId, selectedAssets, selectedAccess, selectedAccounts, formattedNewAssets)
        setSelectedUser(userId)
        setDone(true)
      } catch (err: any) {
        setError(err.message || 'Something went wrong during onboarding')
      }
    })
  }

  // Next Step Validation
  const canContinue = () => {
    if (step === 0) {
      return isNewUser ? newUser.name.trim() !== '' : selectedUser !== ''
    }
    return true
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Onboarding Complete!</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          <strong>{employeeName}</strong> has been onboarded successfully with all chosen hardware, accounts, and access points.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href={`/users/${selectedUser}`} className="btn btn-primary">View Employee Profile</a>
          <button className="btn btn-secondary" onClick={() => { 
            setStep(0)
            setIsNewUser(true)
            setNewUser({ name: '', department: '', mobileNumber: '', deskExtension: '', airportExtension: '' })
            setSelectedUser('')
            setSelectedAssets([])
            setSelectedAccounts([])
            setSelectedAccess([])
            setNewAssets([])
            setDone(false) 
          }}>Onboard Another Employee</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Employee Onboarding</h1>
        <p className="text-muted text-sm">Follow the structured steps below to set up a new or existing employee.</p>
      </div>

      {/* Wizard Steps indicator */}
      <div className="wizard-steps" style={{ marginBottom: '2rem' }}>
        {STEPS.map((s, i) => (
          <div key={s} className={`wizard-step-item ${i === step ? 'active' : i < step ? 'done' : ''}`}>
            <div className="wizard-step-num">{i < step ? '✓' : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="card card-p" style={{ minHeight: '320px' }}>
        
        {/* Step 1: Employee Details */}
        {step === 0 && (
          <div>
            <div className="section-title">Employee Information</div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>Are you onboarding a brand new employee or configuring resources for an existing one?</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button 
                type="button" 
                className={`btn ${isNewUser ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setIsNewUser(true); setSelectedUser('') }}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                ➕ Create New Employee Profile
              </button>
              <button 
                type="button" 
                className={`btn ${!isNewUser ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsNewUser(false)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                🔍 Select Existing Employee
              </button>
            </div>

            {isNewUser ? (
              <div className="form-grid-2">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Full Name <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Maria Michael"
                    value={newUser.name}
                    onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select 
                    className="form-select"
                    value={newUser.department}
                    onChange={e => setNewUser(p => ({ ...p, department: e.target.value }))}
                  >
                    <option value="">-- Select --</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Desk Extension</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 201"
                    value={newUser.deskExtension}
                    onChange={e => setNewUser(p => ({ ...p, deskExtension: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Airport/Role Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. COO, GM"
                    value={newUser.airportExtension}
                    onChange={e => setNewUser(p => ({ ...p, airportExtension: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Corporate Mobile Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. +357 99 000000"
                    value={newUser.mobileNumber}
                    onChange={e => setNewUser(p => ({ ...p, mobileNumber: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Search Directory</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Type name or department to filter..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    style={{ marginBottom: '0.75rem' }}
                  />
                </div>
                <div className="check-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {filteredUsers.map(u => (
                    <label 
                      key={u.id} 
                      className={`check-item ${selectedUser === u.id ? 'checked' : ''}`}
                      onClick={() => setSelectedUser(u.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <input type="radio" readOnly checked={selectedUser === u.id} style={{ marginRight: '0.75rem' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{u.name}</div>
                        <div className="text-xs text-muted">{u.department ?? 'No Department'}</div>
                      </div>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <p>No matching employees found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Accounts & Emails */}
        {step === 1 && (
          <div>
            <div className="section-title">Accounts & Emails setup for {employeeName}</div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
              Assign a primary Microsoft 365 Account and select any Shared Mailboxes or Distribution Lists required.
            </p>

            {/* Primary Microsoft 365 Account */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--foreground)' }}>Primary Microsoft 365 Account</div>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search M365 directory by name or email..."
                value={accountSearch}
                onChange={e => setAccountSearch(e.target.value)}
                style={{ marginBottom: '0.75rem' }}
              />
              <div className="check-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filteredM365.map(a => {
                  const isChecked = selectedAccounts.includes(a.id)
                  return (
                    <label 
                      key={a.id} 
                      className={`check-item ${isChecked ? 'checked' : ''}`} 
                      onClick={() => {
                        toggleAccount(a.id)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <input type="checkbox" readOnly checked={isChecked} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.displayName}</div>
                        <div className="font-mono text-xs text-muted">{a.email}</div>
                      </div>
                      {a.licenses && <span className="badge badge-purple">{a.licenses.split(',')[0]}</span>}
                    </label>
                  )
                })}
                {filteredM365.length === 0 && (
                  <div className="empty-state" style={{ padding: '1.5rem' }}>
                    <p>No unassigned accounts in M365 Directory.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shared Mailboxes & DLs */}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--foreground)' }}>Shared Mailboxes & Distribution Lists Access</div>
              <div className="check-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {mailboxes.map(ap => (
                  <label key={ap.id} className={`check-item ${selectedAccess.includes(ap.id) ? 'checked' : ''}`} onClick={() => toggleAccess(ap.id)} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" readOnly checked={selectedAccess.includes(ap.id)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ap.name}</div>
                      {ap.description && <div className="text-xs text-muted">{ap.description}</div>}
                    </div>
                    <span className={typeColor(ap.type)}>{ap.type}</span>
                  </label>
                ))}
                {mailboxes.length === 0 && (
                  <div className="empty-state" style={{ padding: '1.5rem' }}>
                    <p>No shared mailboxes configured in Matrix.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Systems & Platforms */}
        {step === 2 && (
          <div>
            <div className="section-title">Systems & Digital Access for {employeeName}</div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>Select which digital systems, SharePoint drives, file servers, and platforms this employee needs access to.</p>
            <div className="check-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {systems.map(ap => (
                <label key={ap.id} className={`check-item ${selectedAccess.includes(ap.id) ? 'checked' : ''}`} onClick={() => toggleAccess(ap.id)} style={{ cursor: 'pointer' }}>
                  <input type="checkbox" readOnly checked={selectedAccess.includes(ap.id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ap.name}</div>
                    {ap.description && <div className="text-xs text-muted">{ap.description}</div>}
                  </div>
                  <span className={typeColor(ap.type)}>{ap.type}</span>
                </label>
              ))}
              {systems.length === 0 && (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <p>No digital systems configured in Matrix.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Equipment & Office Setup */}
        {step === 3 && (
          <div>
            <div className="section-title">Equipment & Office Setup for {employeeName}</div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>Assign physical IT hardware assets and physical office printer permissions.</p>

            {/* Hardware Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)' }}>Physical Hardware Inventory</div>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setShowAddAssetModal(true)}
                >
                  ➕ Create &amp; Assign New Asset
                </button>
              </div>

              <div className="check-list" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {stockAssets.length === 0 && newAssets.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem' }}>
                    <p>No hardware in stock. Add assets via Inventory, or click "Create &amp; Assign New Asset" above.</p>
                  </div>
                ) : (
                  <>
                    {/* Render newly added assets */}
                    {newAssets.map(a => (
                      <div 
                        key={a.tempId} 
                        className="check-item checked"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input type="checkbox" readOnly checked style={{ marginRight: '0.75rem' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                              🆕 {a.category}: {a.brandModel}
                            </div>
                            {a.serialImei && <div className="font-mono text-xs text-muted">S/N: {a.serialImei}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-green">New to Create</span>
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '0.1rem 0.3rem', minWidth: 'unset' }}
                            onClick={(e) => {
                              e.preventDefault()
                              setNewAssets(prev => prev.filter(x => x.tempId !== a.tempId))
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

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
                        }} style={{ cursor: 'pointer' }}>
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
                      }} style={{ cursor: 'pointer' }}>
                        <input type="checkbox" readOnly checked={selectedAssets.includes(a.id)} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.category}: {a.brandModel}</div>
                          {a.serialImei && <div className="font-mono text-xs text-muted">S/N: {a.serialImei}</div>}
                        </div>
                        <span className="badge badge-blue">Serialized</span>
                      </label>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Office Printer Access */}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--foreground)' }}>Physical Office Printer Permissions</div>
              <div className="check-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {printers.map(ap => (
                  <label key={ap.id} className={`check-item ${selectedAccess.includes(ap.id) ? 'checked' : ''}`} onClick={() => toggleAccess(ap.id)} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" readOnly checked={selectedAccess.includes(ap.id)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ap.name}</div>
                      {ap.description && <div className="text-xs text-muted">{ap.description}</div>}
                    </div>
                    <span className={typeColor(ap.type)}>{ap.type}</span>
                  </label>
                ))}
                {printers.length === 0 && (
                  <div className="empty-state" style={{ padding: '1.5rem' }}>
                    <p>No printers configured in Access Matrix.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 4 && (
          <div>
            <div className="section-title">Review & Confirm Onboarding</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              
              {/* Employee section */}
              <div className="card card-p" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--foreground-muted)', marginBottom: '0.5rem' }}>Employee profile</div>
                {isNewUser ? (
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{newUser.name}</div>
                    <div className="text-sm" style={{ color: 'var(--accent)', fontWeight: 500 }}>{newUser.department || 'No department'} (New Profile)</div>
                    {newUser.mobileNumber && <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>📱 {newUser.mobileNumber}</div>}
                    {newUser.deskExtension && <div className="text-xs text-muted">☎ Extension: {newUser.deskExtension}</div>}
                    {newUser.airportExtension && <div className="text-xs text-muted">✈ Role Code: {newUser.airportExtension}</div>}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{existingUser?.name}</div>
                    <div className="text-sm text-muted">{existingUser?.department || 'No department'} (Existing Profile)</div>
                  </div>
                )}
              </div>

              {/* Hardware assigned */}
              <div className="card card-p" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--foreground-muted)', marginBottom: '0.5rem' }}>Physical Hardware ({selectedAssets.length + newAssets.length} items)</div>
                {selectedAssets.length === 0 && newAssets.length === 0 ? <div className="text-sm text-muted">No equipment selected</div> : (
                  <>
                    {stockAssets.filter(a => selectedAssets.includes(a.id)).map(a => (
                      <div key={a.id} className="text-sm" style={{ marginBottom: '0.25rem' }}>🔹 {a.category}: {a.brandModel}</div>
                    ))}
                    {newAssets.map(a => (
                      <div key={a.tempId} className="text-sm" style={{ marginBottom: '0.25rem', color: 'var(--green)' }}>➕ [New] {a.category}: {a.brandModel}</div>
                    ))}
                  </>
                )}
              </div>

              {/* Accounts & Access */}
              <div className="card card-p" style={{ gridColumn: '1 / -1', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--foreground-muted)', marginBottom: '0.75rem' }}>Accounts, digital access & office systems</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '0.375rem' }}>M365 & Emails</div>
                    {selectedAccounts.length === 0 ? <div className="text-xs text-muted">No accounts linked</div> : availableM365Accounts.filter(a => selectedAccounts.includes(a.id)).map(a => (
                      <div key={a.id} className="text-sm" style={{ fontWeight: 500 }}>📧 {a.email}</div>
                    ))}
                    {accessPoints.filter(ap => ap.type === 'Mailbox' && selectedAccess.includes(ap.id)).map(ap => (
                      <div key={ap.id} className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>📬 Shared: {ap.name}</div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '0.375rem' }}>Permissions & Printers</div>
                    {accessPoints.filter(ap => ap.type !== 'Mailbox' && selectedAccess.includes(ap.id)).map(ap => (
                      <div key={ap.id} className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        🔑 <span className={typeColor(ap.type)} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>{ap.type}</span>
                        <span>{ap.name}</span>
                      </div>
                    ))}
                    {accessPoints.filter(ap => ap.type !== 'Mailbox' && selectedAccess.includes(ap.id)).length === 0 && (
                      <div className="text-xs text-muted">No digital permissions or printers selected</div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="alert alert-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>Upon completion, {isNewUser ? 'the employee profile will be created, ' : ''}assets will be marked as assigned, and access entries will be recorded instantly in the logs.</div>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0 || pending}>
          ◀ Back
        </button>
        {step < 4 ? (
          <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canContinue()}>
            Continue ▶
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleComplete} disabled={pending}>
            {pending ? 'Processing...' : '✅ Complete Onboarding'}
          </button>
        )}
      </div>

      {/* On-the-fly Asset Modal */}
      {showAddAssetModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddAssetModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Create &amp; Assign New Hardware</span>
              <button className="modal-close" onClick={() => setShowAddAssetModal(false)}><CloseIcon /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const type = fd.get('type') as string;
              const category = fd.get('category') as string;
              const brandModel = (fd.get('brandModel') as string).trim();
              const serialImei = (fd.get('serialImei') as string || '').trim();
              const conditionComment = (fd.get('conditionComment') as string || '').trim();

              if (!category || !brandModel) return;

              const tempAsset = {
                tempId: Math.random().toString(36).substr(2, 9),
                type,
                category,
                brandModel,
                serialImei: type === 'Serialized' ? serialImei : undefined,
                conditionComment: conditionComment || undefined
              };

              setNewAssets(prev => [...prev, tempAsset]);
              setShowAddAssetModal(false);
            }}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Tracking Type</label>
                    <select name="type" className="form-select" defaultValue="Serialized">
                      <option value="Serialized">Serialized (individual S/N)</option>
                      <option value="Bulk">Bulk (no S/N tracked)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category <span>*</span></label>
                    <select name="category" className="form-select" required>
                      <option value="">-- Select --</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Brand / Model <span>*</span></label>
                    <input name="brandModel" className="form-input" required placeholder="e.g. ThinkBook 13s Intel Core i5" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Serial Number / IMEI (If Serialized)</label>
                    <input name="serialImei" className="form-input" placeholder="e.g. 15682BMR3WLV9B7R62" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notes / Condition</label>
                    <textarea name="conditionComment" className="form-textarea" placeholder="e.g. Brand new, boxed" rows={2} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAssetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
