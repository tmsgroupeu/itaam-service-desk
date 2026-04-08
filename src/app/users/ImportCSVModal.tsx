'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { importUsersFromCSV } from '@/app/actions'
import { useRouter } from 'next/navigation'

export function ImportCSVModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number, skipped: number } | null>(null)
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
      // Since M365 exports are tab separated surprisingly in the copy-paste, 
      // but usually CSV is comma separated. We let PapaParse autodetect delimiter.
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, string>[]
          
          if (rows.length === 0) {
            setError('File appears to be empty')
            setLoading(false)
            return
          }

          // Trigger Server Action
          const res = await importUsersFromCSV(rows)
          
          if (res.success) {
            setResult({ imported: res.imported, skipped: res.skipped })
            router.refresh()
          } else {
            setError((res as any).error || 'Failed to import users')
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
          <h2 className="section-title">Import Users from M365</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>✕</button>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Import Complete!</h3>
            <p>Successfully imported <strong>{result.imported}</strong> users.</p>
            {result.skipped > 0 && <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Skipped <strong>{result.skipped}</strong> generic/duplicate accounts.</p>}
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>
              Upload your "Active Users" `.csv` export directly from exactly Microsoft 365 Admin Center.
            </p>
            
            <div className="form-group">
              <input 
                type="file" 
                accept=".csv,text/csv" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
                className="form-control"
              />
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={!file || loading}>
                {loading ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
