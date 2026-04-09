'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { syncM365Accounts } from '@/app/actions'
import { useRouter } from 'next/navigation'

export function ImportCSVModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [tenantName, setTenantName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number, updated: number, skipped: number } | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import')
      return
    }

    setLoading(true)
    setError('')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, string>[]
          if (rows.length === 0) {
            setError('File appears to be empty')
            setLoading(false)
            return
          }

          const res = await syncM365Accounts(rows, tenantName || undefined)
          if (res.success) {
            setResult({ created: res.created!, updated: res.updated!, skipped: res.skipped! })
            router.refresh()
          } else {
            setError('Failed to sync accounts')
          }
        } catch (err) {
          setError('An error occurred during import')
          console.error(err)
        } finally {
          setLoading(false)
        }
      },
      error: (err) => {
        setError(`Failed to parse file: ${err.message}`)
        setLoading(false)
      }
    })
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 className="section-title">Import M365 Accounts</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>✕</button>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Sync Complete!</h3>
            <p>Created <strong>{result.created}</strong> new accounts.</p>
            <p>Updated <strong>{result.updated}</strong> existing accounts.</p>
            {result.skipped > 0 && <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Skipped <strong>{result.skipped}</strong> accounts (no changes/invalid).</p>}
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>
              Upload your "Active Users" `.csv` export from Microsoft 365 Admin Center.
            </p>
            
            <div className="form-group">
              <label className="form-label">Tenant Name (Optional)</label>
              <input type="text" className="form-input" placeholder="e.g. MyCompany Ltd" value={tenantName} onChange={e => setTenantName(e.target.value)} disabled={loading} />
              <div className="form-hint">Useful if you manage multiple M365 tenants.</div>
            </div>

            <div className="form-group">
              <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={loading} className="form-control" />
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={!file || loading}>
                {loading ? 'Syncing...' : 'Start Sync'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
