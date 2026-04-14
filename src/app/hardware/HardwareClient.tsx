'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { createAsset, updateAsset, deleteAsset, assignAsset, unassignAsset, updateAssetStatus, addBulkQuantity, removeBulkQuantity } from '@/app/actions'
import type { Asset, User } from '@prisma/client'

type AssetRow = Asset & { assignedUser: User | null }

const CATEGORIES = ['Laptop', 'Desktop', 'Monitor', 'Mobile', 'Phone Console', 'Printer', 'Keyboard', 'Mouse', 'Headset', 'Cable', 'Other']
const STATUSES = ['In Stock', 'Assigned', 'Broken', 'Pending Return', 'Retired']

function statusBadge(s: string) {
  const m: Record<string, string> = { Assigned: 'badge-green', 'In Stock': 'badge-blue', Broken: 'badge-red', Retired: 'badge-gray', 'Pending Return': 'badge-yellow' }
  return `badge ${m[s] ?? 'badge-gray'}`
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

interface AddEditModalProps { asset?: AssetRow; onClose: () => void }

function AddEditModal({ asset, onClose }: AddEditModalProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState(asset?.type ?? 'Serialized')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      if (asset) await updateAsset(asset.id, fd)
      else await createAsset(fd)
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{asset ? 'Edit Asset' : 'Add New Asset'}</span>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Tracking Type</label>
                <select name="type" className="form-select" defaultValue={asset?.type ?? 'Serialized'} onChange={e => setType(e.target.value)} disabled={!!asset}>
                  <option value="Serialized">Serialized (individual S/N)</option>
                  <option value="Bulk">Bulk (no S/N tracked)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category <span>*</span></label>
                <select name="category" className="form-select" defaultValue={asset?.category ?? ''} required>
                  <option value="">— Select —</option>
                  {CATEGORIES.filter(c => type === 'Serialized' || ['Keyboard', 'Mouse', 'Headset', 'Cable'].includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Brand / Model <span>*</span></label>
                <input name="brandModel" className="form-input" required defaultValue={asset?.brandModel} placeholder="e.g. ThinkBook 13s Intel Core i5 – 16GB – 512GB SSD" />
              </div>
              {type === 'Serialized' && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Serial Number / IMEI</label>
                  <input name="serialImei" className="form-input" defaultValue={asset?.serialImei ?? ''} placeholder="e.g. 15682BMR3WLV9B7R62" />
                </div>
              )}
              {!asset && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Quantity</label>
                  <input name="quantity" type="number" min="1" max="500" className="form-input" defaultValue="1" />
                  <div className="form-hint">Generates this many "In Stock" assets. For Serialized, identical copies will be created.</div>
                </div>
              )}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Notes / Condition</label>
                <textarea name="conditionComment" className="form-textarea" defaultValue={asset?.conditionComment ?? ''} placeholder="e.g. Keyboard replacement needed, extra charger included" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : asset ? 'Save Changes' : 'Add Asset'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ManageModalProps { asset: AssetRow; users: User[]; onClose: () => void }

function ManageModal({ asset, users, onClose }: ManageModalProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedUser, setSelectedUser] = useState('')
  const [newStatus, setNewStatus] = useState(asset.status)

  const handleAssign = () => {
    if (!selectedUser) return
    startTransition(async () => { await assignAsset(asset.id, selectedUser); router.refresh(); onClose() })
  }
  const handleUnassign = () => {
    startTransition(async () => { await unassignAsset(asset.id, 'In Stock'); router.refresh(); onClose() })
  }
  const handleStatusChange = () => {
    startTransition(async () => { await updateAssetStatus(asset.id, newStatus); router.refresh(); onClose() })
  }
  const handleDelete = () => {
    if (!confirm('Permanently delete this asset and all its logs?')) return
    startTransition(async () => { await deleteAsset(asset.id); router.refresh(); onClose() })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Manage: {asset.category}</span>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div className="text-sm" style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{asset.brandModel}</div>
            {asset.serialImei && <div className="font-mono text-xs text-muted">S/N: {asset.serialImei}</div>}
            <div style={{ marginTop: '0.375rem' }}><span className={statusBadge(asset.status)}>{asset.status}</span></div>
          </div>

          {asset.status === 'Assigned' && asset.assignedUser && (
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              Assigned to <strong>{asset.assignedUser.name}</strong> ({asset.assignedUser.department})
            </div>
          )}

          <hr className="divider" />

          {asset.status !== 'Assigned' && (
            <div className="form-group">
              <label className="form-label">Assign to Employee</label>
              <select className="form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">— Select employee —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department ?? 'No dept'})</option>)}
              </select>
              <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={!selectedUser || pending} onClick={handleAssign}>{pending ? 'Assigning…' : 'Assign to Employee'}</button>
            </div>
          )}

          {asset.status === 'Assigned' && (
            <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleUnassign} disabled={pending}>
              Return to Stock
            </button>
          )}

          <div className="form-group">
            <label className="form-label">Change Status</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn btn-secondary" onClick={handleStatusChange} disabled={pending || newStatus === asset.status}>Update</button>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-danger" onClick={handleDelete} disabled={pending}>Delete Asset</button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function BulkManageModal({ group, onClose }: { group: any, onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [addQty, setAddQty] = useState(1)
  const [removeQty, setRemoveQty] = useState(1)

  const handleAdd = () => {
    startTransition(async () => {
      await addBulkQuantity(group.category, group.brandModel, addQty)
      router.refresh()
      onClose()
    })
  }

  const handleRemove = () => {
    startTransition(async () => {
      await removeBulkQuantity(group.category, group.brandModel, removeQty)
      router.refresh()
      onClose()
    })
  }

  const handleDeleteAll = () => {
    if (!confirm(`Delete all ${group.inStock} unused items from stock?`)) return
    startTransition(async () => {
      await removeBulkQuantity(group.category, group.brandModel, group.inStock)
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Manage Bulk Asset</span>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div className="text-sm text-muted" style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{group.category}</div>
            <div style={{ fontWeight: 600 }}>{group.brandModel}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-card)' }}>
              <div className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>In Stock</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--blue)' }}>{group.inStock}</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-card)' }}>
              <div className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>Assigned</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--green)' }}>{group.assigned}</div>
            </div>
          </div>

          <hr className="divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="form-label">Add More to Stock</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" min="1" max="500" className="form-input" value={addQty} onChange={e => setAddQty(parseInt(e.target.value) || 1)} />
                <button className="btn btn-primary" onClick={handleAdd} disabled={pending}>+ Add Items</button>
              </div>
            </div>
            <div>
              <label className="form-label">Remove from Stock</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" min="1" max={group.inStock} className="form-input" value={removeQty} onChange={e => setRemoveQty(parseInt(e.target.value) || 1)} />
                <button className="btn btn-secondary" onClick={handleRemove} disabled={pending || group.inStock === 0 || removeQty > group.inStock}>- Remove Items</button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-danger" onClick={handleDeleteAll} disabled={pending || group.inStock === 0}>Clear All Stock</button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export function HardwareClient({ assets, users }: { assets: AssetRow[]; users: User[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<AssetRow | null>(null)
  const [manageAsset, setManageAsset] = useState<AssetRow | null>(null)
  const [manageBulkGroup, setManageBulkGroup] = useState<any>(null)
  const [filter, setFilter] = useState('All')

  const statusFilters = ['All', 'Assigned', 'In Stock', 'Broken', 'Pending Return', 'Retired']
  const filtered = filter === 'All' ? assets : assets.filter(a => a.status === filter)

  // Perform grouping for Bulk assets to avoid showing 50 identical mice
  const groupedBulk: Record<string, any> = {}
  const displayAssets: any[] = []

  filtered.forEach(a => {
    if (a.type === 'Bulk') {
      const gKey = a.category + '|' + a.brandModel
      if (!groupedBulk[gKey]) {
        groupedBulk[gKey] = { groupKey: gKey, category: a.category, brandModel: a.brandModel, total: 0, assigned: 0, inStock: 0, sampleId: a.id }
        displayAssets.push({ isGroup: true, ...groupedBulk[gKey] })
      }
      groupedBulk[gKey].total++
      if (a.status === 'Assigned') groupedBulk[gKey].assigned++
      else if (a.status === 'In Stock') groupedBulk[gKey].inStock++
    } else {
      displayAssets.push({ isGroup: false, item: a })
    }
  })

  // Sort groups alphabetically by category/model
  displayAssets.sort((a, b) => {
    const aStr = a.isGroup ? a.category + a.brandModel : a.item.category + a.item.brandModel
    const bStr = b.isGroup ? b.category + b.brandModel : b.item.category + b.item.brandModel
    return aStr.localeCompare(bStr)
  })

  return (
    <>
      {addOpen && <AddEditModal onClose={() => setAddOpen(false)} />}
      {editAsset && <AddEditModal asset={editAsset} onClose={() => setEditAsset(null)} />}
      {manageAsset && <ManageModal asset={manageAsset} users={users} onClose={() => setManageAsset(null)} />}
      {manageBulkGroup && <BulkManageModal group={manageBulkGroup} onClose={() => setManageBulkGroup(null)} />}

      <div className="page-header">
        <h1 className="page-title">Hardware Inventory</h1>
        <div className="btn-group">
          <button className="btn btn-secondary" disabled title="CSV export coming soon.">Export CSV</button>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>+ Add Asset</button>
        </div>
      </div>

      <div className="tabs">
        {statusFilters.map(s => (
          <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Type</th><th>Category</th><th>Brand / Model</th><th>Serial / IMEI</th><th>Status</th><th>Assigned To</th><th>Actions</th></tr></thead>
          <tbody>
            {displayAssets.map((row, idx) => {
              if (row.isGroup) {
                return (
                  <tr key={`group-${idx}`} style={{ backgroundColor: 'rgba(0,0,0,0.015)' }}>
                    <td><span className="badge badge-purple">Bulk</span></td>
                    <td style={{ fontWeight: 600 }}>{row.category}</td>
                    <td className="text-sm" style={{ fontWeight: 500 }}>{row.brandModel}</td>
                    <td className="font-mono text-muted">—</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="badge badge-blue">Stock: {row.inStock}</span>
                        {row.assigned > 0 && <span className="badge badge-green">Asg: {row.assigned}</span>}
                      </div>
                    </td>
                    <td className="text-sm text-muted">Multiple ({row.assigned})</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setManageBulkGroup(row)}>Manage Bulk</button>
                    </td>
                  </tr>
                )
              } else {
                const a = row.item
                return (
                  <tr key={a.id}>
                    <td><span className={`badge ${a.type === 'Serialized' ? 'badge-blue' : 'badge-gray'}`}>{a.type}</span></td>
                    <td style={{ fontWeight: 500 }}>{a.category}</td>
                    <td className="text-sm" style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.brandModel}</td>
                    <td className="font-mono">{a.serialImei ?? '—'}</td>
                    <td><span className={statusBadge(a.status)}>{a.status}</span></td>
                    <td className="text-sm">{a.assignedUser ? (<a href={`/users/${a.assignedUser.id}`} style={{ color: 'var(--accent)' }}>{a.assignedUser.name}</a>) : <span className="text-muted">—</span>}</td>
                    <td>
                      <div className="action-bar">
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditAsset(a)}>Edit</button>
                        <button className="btn btn-primary btn-sm" onClick={() => setManageAsset(a)}>Manage</button>
                      </div>
                    </td>
                  </tr>
                )
              }
            })}
            {displayAssets.length === 0 && <tr><td colSpan={7} className="table-empty">No assets with status <strong>{filter}</strong>.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
