'use client'

import { useTransition, useRef } from 'react'
import { updateTicketStatus, addTicketComment } from '@/app/actions'
import type { Ticket, TicketComment, User, Asset } from '@prisma/client'
import Link from 'next/link'

type FullTicket = Ticket & {
  author: User
  asset: Asset | null
  comments: TicketComment[]
}

function statusColor(status: string) {
  const m: Record<string, string> = {
    Open: 'badge-yellow',
    'In Progress': 'badge-blue',
    'Waiting on User': 'badge-purple',
    Resolved: 'badge-green',
    Closed: 'badge-gray',
  }
  return `badge ${m[status] ?? 'badge-gray'}`
}

export function TicketDetailClient({ ticket }: { ticket: FullTicket }) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === ticket.status) return
    startTransition(async () => {
      await updateTicketStatus(ticket.id, newStatus)
    })
  }

  const handleAddComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await addTicketComment(ticket.id, fd)
      formRef.current?.reset()
    })
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/tickets" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Service Desk
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>{ticket.title}</h1>
            <div className="text-sm text-muted" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span>ID: <span className="font-mono">...{ticket.id.slice(-6)}</span></span>
              <span>•</span>
              <span>Opened {new Date(ticket.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className={statusColor(ticket.status)}>{ticket.status}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="text-sm">Change Status:</span>
            <select 
              className="form-select" 
              style={{ width: 'auto' }}
              value={ticket.status}
              disabled={pending}
              onChange={e => handleStatusChange(e.target.value)}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting on User">Waiting on User</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Main Column: Description and Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card card-p">
            <h3 className="section-title">Description</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {ticket.description}
            </div>
          </div>

          <div className="card card-p">
            <h3 className="section-title">Communication History</h3>
            
            <div className="timeline" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
              {ticket.comments.map((comment, i) => (
                <div key={comment.id} className="timeline-item">
                  {i < ticket.comments.length - 1 && <div className="timeline-line"></div>}
                  <div className={`timeline-dot ${comment.isAdmin ? 'blue' : ''}`}></div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{comment.isAdmin ? 'IT Support' : ticket.author.name}</span>
                      <span className="text-xs text-muted">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    {/* Auto-comments for status changes don't need a huge box */}
                    {comment.isAdmin && comment.body.startsWith('Status changed to:') ? (
                      <div className="text-sm text-muted font-mono" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                        {comment.body}
                      </div>
                    ) : (
                      <div className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {comment.body}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {ticket.comments.length === 0 && <span className="text-sm text-muted">No communication history yet.</span>}
            </div>

            <hr className="divider" style={{ margin: '1.5rem -1.5rem' }} />

            <form ref={formRef} onSubmit={handleAddComment}>
              <div className="form-group">
                <label className="form-label">Add Comment</label>
                <textarea 
                  name="body" 
                  className="form-textarea" 
                  required 
                  placeholder="Type your message here... This will be added to the timeline."
                  rows={4}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Side Column: Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card card-p">
            <h3 className="section-title">Requested By</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div className="profile-avatar" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                {ticket.author.name.substring(0,2).toUpperCase()}
              </div>
              <div>
                <Link href={`/users/${ticket.authorId}`} style={{ fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                  {ticket.author.name}
                </Link>
                <div className="text-sm text-muted">{ticket.author.department ?? 'No Department'}</div>
              </div>
            </div>
            {ticket.author.deskExtension && <div className="text-sm text-muted">Ext: {ticket.author.deskExtension}</div>}
            {ticket.author.mobileNumber && <div className="text-sm text-muted">Mob: {ticket.author.mobileNumber}</div>}
          </div>

          <div className="card card-p">
            <h3 className="section-title">Ticket Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Priority</span>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ticket.priority}</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Category</span>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ticket.category}</span>
              </div>
              {ticket.asset && (
                <div>
                  <span className="text-xs text-muted" style={{ display: 'block' }}>Linked Asset</span>
                  <div style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginTop: '0.25rem' }}>
                    <div style={{ fontWeight: 600 }}>{ticket.asset.category}</div>
                    <div className="text-muted">{ticket.asset.brandModel.substring(0, 30)}</div>
                    {ticket.asset.serialImei && <div className="font-mono text-xs" style={{ marginTop: '0.25rem' }}>{ticket.asset.serialImei}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
