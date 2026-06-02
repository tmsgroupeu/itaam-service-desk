'use client'

import { useState, useMemo } from 'react'
import type { M365Account, User } from '@prisma/client'
import { ImportCSVModal } from './ImportCSVModal'

type AccountRow = M365Account & { assignedUser: User | null }

export function AccountsClient({ accounts }: { accounts: AccountRow[] }) {
  const [importOpen, setImportOpen] = useState(false)
  
  // Search & Filter States
  const [filterTenant, setFilterTenant] = useState('')
  const [assignFilter, setAssignFilter] = useState('All') // 'All', 'Assigned', 'Unassigned'
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 25

  const tenants = Array.from(new Set(accounts.map(a => a.tenantName).filter(Boolean)))

  // Filtering accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      if (filterTenant && a.tenantName !== filterTenant) return false
      
      if (assignFilter === 'Assigned' && !a.assignedUserId) return false
      if (assignFilter === 'Unassigned' && a.assignedUserId) return false

      if (search) {
        const query = search.toLowerCase()
        const matchName = a.displayName.toLowerCase().includes(query)
        const matchEmail = a.email.toLowerCase().includes(query)
        const matchDept = a.department && a.department.toLowerCase().includes(query)
        if (!matchName && !matchEmail && !matchDept) return false
      }

      return true
    })
  }, [accounts, filterTenant, assignFilter, search])

  // Reset page when filters change
  useMemo(() => {
    setPage(1)
  }, [filterTenant, assignFilter, search])

  // Pagination calculations
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage) || 1
  const paginatedAccounts = useMemo(() => {
    return filteredAccounts.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  }, [filteredAccounts, page])

  return (
    <>
      {importOpen && <ImportCSVModal onClose={() => setImportOpen(false)} />}

      <div className="page-header">
        <h1 className="page-title">M365 Accounts Directory</h1>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => setImportOpen(true)}>Sync M365 CSV</button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search by name, email, department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '320px' }}
        />
        
        {tenants.length > 0 && (
          <select className="form-select" style={{ maxWidth: '200px' }} value={filterTenant} onChange={e => setFilterTenant(e.target.value)}>
            <option value="">All Tenants</option>
            {tenants.map(t => <option key={t!} value={t!}>{t}</option>)}
          </select>
        )}

        <select className="form-select" style={{ maxWidth: '200px' }} value={assignFilter} onChange={e => setAssignFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Assigned">Assigned Accounts</option>
          <option value="Unassigned">Unassigned Accounts</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Display Name</th>
              <th>Email (UPN)</th>
              <th>Department</th>
              <th>Tenant</th>
              <th>Licenses</th>
              <th>Biological User</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAccounts.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.displayName}</td>
                <td className="text-sm">{a.email}</td>
                <td className="text-sm text-muted">{a.department || '-'}</td>
                <td className="text-sm">{a.tenantName ? <span className="badge badge-gray">{a.tenantName}</span> : '-'}</td>
                <td>
                  {a.licenses ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {a.licenses.split(',').map((l: string) => <span key={l} className="badge badge-blue">{l.trim()}</span>)}
                    </div>
                  ) : <span className="text-muted">-</span>}
                </td>
                <td>
                  {a.assignedUser ? (
                    <a href={`/users/${a.assignedUser.id}`} className="badge badge-green" style={{ textDecoration: 'none' }}>
                      Assigned: {a.assignedUser.name}
                    </a>
                  ) : (
                    <span className="badge badge-yellow">Unassigned</span>
                  )}
                </td>
              </tr>
            ))}
            {paginatedAccounts.length === 0 && (
              <tr>
                <td colSpan={6} className="table-empty">
                  No accounts found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <div className="text-xs text-muted">
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredAccounts.length)} of {filteredAccounts.length} accounts
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
