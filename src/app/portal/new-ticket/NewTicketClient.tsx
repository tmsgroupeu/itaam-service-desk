'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTicket } from '@/app/actions'
import type { Asset } from '@prisma/client'
import Link from 'next/link'

export function NewTicketClient({ authorId, userAssets }: { authorId: string, userAssets: Asset[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createTicket(fd)
      router.push('/portal')
      router.refresh()
    })
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/portal" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.25rem' }}><polyline points="15 18 9 12 15 6"/></svg>
          Back to Portal
        </Link>
        <h1 className="page-title">Submit a Support Ticket</h1>
        <p className="text-muted">Describe your issue below and our IT Support team will assist you shortly.</p>
      </div>

      <div className="card card-p">
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="authorId" value={authorId} />
          
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Issue Summary (Title) <span>*</span></label>
              <input name="title" className="form-input" required placeholder="e.g. Cannot access email account" />
            </div>

            <div className="form-group">
              <label className="form-label">Category <span>*</span></label>
              <select name="category" className="form-select" required defaultValue="">
                <option value="" disabled>— Select Category —</option>
                <option value="Hardware Issue">Hardware Issue</option>
                <option value="Software / App">Software / App</option>
                <option value="Network / Internet">Network / Internet</option>
                <option value="Access Request">Account / Access Request</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select name="priority" className="form-select" defaultValue="Medium">
                <option value="Low">Low - Not urgent</option>
                <option value="Medium">Medium - Normal issue</option>
                <option value="High">High - Blocking my work</option>
                <option value="Critical">Critical - System down</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Related Equipment (Optional)</label>
              <select name="assetId" className="form-select">
                <option value="">— Not specific to an equipment —</option>
                {userAssets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.category}: {a.brandModel} {a.serialImei && `(S/N: ${a.serialImei})`}
                  </option>
                ))}
              </select>
              <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Select a device if this issue is specifically about hardware you are assigned.</div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Detailed Description <span>*</span></label>
              <textarea 
                name="description" 
                className="form-textarea" 
                rows={6} 
                required 
                placeholder="Please describe exactly what is happening, what you were trying to do, and any error messages you see." 
              />
            </div>
            
            {/* Initial Comment injection hidden to pass to action */}
            <input type="hidden" name="comment" value="" />
          </div>

          <hr className="divider" style={{ margin: '2rem -1.5rem 1.5rem -1.5rem' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link href="/portal" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
