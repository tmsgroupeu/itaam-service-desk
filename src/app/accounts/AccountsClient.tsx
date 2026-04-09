'use client'

import { useState } from 'react'
import type { M365Account, User } from '@prisma/client'
import { ImportCSVModal } from './ImportCSVModal'

type AccountRow = M365Account & { assignedUser: User | null }

export function AccountsClient({ accounts }: { accounts: AccountRow[] }) {
  const [importOpen, setImportOpen] = useState(false)
  const [filterTenant, setFilterTenant] = useState('')

  const tenants = Array.from(new Set(accounts.map(a => a.tenantName).filter(Boolean)))

  const filteredAccounts = accounts.filter(a => {
    if (filterTenant && a.tenantName !== filterTenant) return false
    return true
  })

  return (
    <>
      {importOpen && <ImportCSVModal onClose={() => setImportOpen(false)} />}

      <div className="page-header">
        <h1 className="page-title">M365 Accounts Directory</h1>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => setImportOpen(true)}>Sync M365 CSV</button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        {tenants.length > 0 && (
          <select className="form-select" style={{ maxWidth: '250px' }} value={filterTenant} onChange={e => setFilterTenant(e.target.value)}>
            <option value="">All Tenants</option>
            {tenants.map(t => <option key={t!} value={t!}>{t}</option>)}
          </select>
        )}
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
            {filteredAccounts.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.displayName}</td>
                <td className="text-sm">{a.email}</td>
                <td className="text-sm text-muted">{a.department || '—'}</td>
                <td className="text-sm">{a.tenantName ? <span className="badge badge-gray">{a.tenantName}</span> : '—'}</td>
                <td>
                  {a.licenses ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {a.licenses.split(',').map((l: string) => <span key={l} className="badge badge-blue">{l.trim()}</span>)}
                    </div>
                  ) : <span className="text-muted">—</span>}
                </td>
                <td>
                  {a.assignedUser ? (
                    <span className="badge badge-green">Assigned: {a.assignedUser.name}</span>
                  ) : (
                    <span className="badge badge-yellow">Unassigned</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={6} className="table-empty">
                  No accounts found. Click <strong>Sync M365 CSV</strong> to import mailboxes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
