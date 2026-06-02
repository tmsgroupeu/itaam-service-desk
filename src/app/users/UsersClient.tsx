'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState, useMemo } from 'react'
import Link from 'next/link'
import { createUser, updateUser, deleteUser } from '@/app/actions'
import type { User } from '@prisma/client'

const DEPARTMENTS = ['IT', 'Front Desk', 'Accounting', 'Technical', 'Purchasing & Crew', 'Sales & PR', 'Customer Support', 'Operations', 'European Navigation', 'Management', 'Greek Office']

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

export interface UserModalProps { user?: User; onClose: () => void }

export function UserModal({ user, onClose }: UserModalProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (user) await updateUser(user.id, fd)
        else await createUser(fd)
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
          <span className="modal-title">{user ? 'Edit Employee' : 'Add New Employee'}</span>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
            <div className="form-grid-2">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Full Name <span>*</span></label>
                <input name="name" className="form-input" required defaultValue={user?.name} placeholder="e.g. Maria Michaill" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select name="department" className="form-select" defaultValue={user?.department ?? ''}>
                  <option value="">-- Select --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Desk Extension</label>
                <input name="deskExtension" className="form-input" defaultValue={user?.deskExtension ?? ''} placeholder="e.g. 201" />
              </div>
              <div className="form-group">
                <label className="form-label">Airport/Role Code</label>
                <input name="airportExtension" className="form-input" defaultValue={user?.airportExtension ?? ''} placeholder="e.g. COO, GM" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Corporate Mobile Number</label>
                <input name="mobileNumber" className="form-input" defaultValue={user?.mobileNumber ?? ''} placeholder="e.g. +357 99 000000" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Saving...' : user ? 'Save Changes' : 'Create Employee'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DeleteModalProps { user: User; onClose: () => void }

function DeleteModal({ user, onClose }: DeleteModalProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUser(user.id)
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <span className="modal-title">Delete Employee</span>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>This will permanently remove <strong>{user.name}</strong>, return all their assigned hardware to stock, and revoke all access rights. This action cannot be undone.</div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={pending}>{pending ? 'Deleting...' : 'Delete Employee'}</button>
        </div>
      </div>
    </div>
  )
}

import type { Asset, UserAccess } from '@prisma/client'

type UserRow = User & { assets: Asset[]; accessPoints: UserAccess[] }

export function UsersClient({ users }: { users: UserRow[] }) {
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  // Search & Filter States
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 20

  // Filtering users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !search || 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.mobileNumber && u.mobileNumber.toLowerCase().includes(search.toLowerCase())) ||
        (u.deskExtension && u.deskExtension.toLowerCase().includes(search.toLowerCase()))
      
      const matchesDept = !deptFilter || u.department === deptFilter

      return matchesSearch && matchesDept
    })
  }, [users, search, deptFilter])

  // Reset page when filters change
  useMemo(() => {
    setPage(1)
  }, [search, deptFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  }, [filteredUsers, page])

  return (
    <>
      {editUser && <UserModal user={editUser} onClose={() => setEditUser(null)} />}
      {deleteTarget && <DeleteModal user={deleteTarget} onClose={() => setDeleteTarget(null)} />}

      <div className="page-header">
        <h1 className="page-title">User Directory</h1>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => alert('Entra ID sync will be enabled after Azure credentials are configured.')}>Sync Entra ID</button>
          <Link href="/workflows/onboard" className="btn btn-primary">+ Onboard Employee</Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search by name, extension, mobile..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '320px' }}
        />
        <select 
          className="form-select"
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{ maxWidth: '240px' }}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Extension</th>
              <th>Hardware</th>
              <th>Access Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                      {u.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{u.name}</div>
                      {u.mobileNumber && <div className="text-xs text-muted">{u.mobileNumber}</div>}
                    </div>
                  </div>
                </td>
                <td className="text-sm text-muted">{u.department ?? '-'}</td>
                <td className="font-mono text-sm">{u.deskExtension ?? '-'}</td>
                <td><span className="badge badge-gray">{u.assets.length} item{u.assets.length !== 1 ? 's' : ''}</span></td>
                <td><span className="badge badge-gray">{u.accessPoints.length} point{u.accessPoints.length !== 1 ? 's' : ''}</span></td>
                <td>
                  <div className="action-bar">
                    <a href={`/users/${u.id}`} className="btn btn-secondary btn-sm">Profile</a>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditUser(u)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="table-empty">
                  No employees found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <div className="text-xs text-muted">
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} employees
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
              >
                Previous
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
