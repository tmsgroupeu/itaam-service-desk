import prisma from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function SearchResultsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const query = params.q?.trim()

  if (!query) {
    return (
      <div className="page-header">
        <h1 className="page-title">Please enter a search term.</h1>
      </div>
    )
  }

  const [users, assets, m365Accounts, accessPoints] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ]
      },
    }),
    prisma.asset.findMany({
      where: {
        OR: [
          { serialImei: { contains: query, mode: 'insensitive' } },
          { brandModel: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: { assignedUser: true }
    }),
    prisma.m365Account.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: { assignedUser: true }
    }),
    prisma.accessPoint.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
        ]
      }
    })
  ])

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header" style={{ marginBottom: '2.5rem', textAlign: 'center', padding: '2rem 0' }}>
        <h1 className="page-title" style={{ fontSize: '2rem' }}>Search Results</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>Found results for <strong>"{query}"</strong></p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Employees Card */}
        <div className="card" style={{ border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '1.5rem' }}>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Employees <span className="badge badge-blue">{users.length}</span>
            </h3>
          </div>
          {users.length > 0 ? (
            <div className="list-group">
              {users.map(u => (
                <div key={u.id} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <Link href={`/users/${u.id}`} className="font-semibold" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>{u.name}</Link>
                    <div className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      {u.email}
                    </div>
                  </div>
                  <div className="text-sm font-medium" style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>{u.department ?? 'No Dept'}</div>
                </div>
              ))}
            </div>
          ) : (
             <div className="table-empty" style={{ padding: '3rem' }}>No employees found.</div>
          )}
        </div>

        {/* Hardware Card */}
        <div className="card" style={{ border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '1.5rem' }}>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              Hardware <span className="badge badge-purple">{assets.length}</span>
            </h3>
          </div>
          {assets.length > 0 ? (
            <div className="list-group">
              {assets.map(a => (
                <div key={a.id} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div className="font-semibold" style={{ fontSize: '1.05rem', color: 'var(--text)' }}>{a.category}: {a.brandModel}</div>
                    <span className="badge badge-gray" style={{ whiteSpace: 'nowrap' }}>{a.status}</span>
                  </div>
                  <div className="text-sm text-muted" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {a.serialImei && <div><span style={{ opacity: 0.7 }}>S/N:</span> <span className="font-mono">{a.serialImei}</span></div>}
                    {a.assignedUser && <div><span style={{ opacity: 0.7 }}>Assigned to:</span> <Link href={`/users/${a.assignedUser.id}`} style={{ color: 'var(--accent)' }}>{a.assignedUser.name}</Link></div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-empty" style={{ padding: '3rem' }}>No hardware found.</div>
          )}
        </div>

        {/* M365 Accounts Card */}
        <div className="card" style={{ border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '1.5rem' }}>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              M365 Accounts <span className="badge badge-green">{m365Accounts.length}</span>
            </h3>
          </div>
          {m365Accounts.length > 0 ? (
            <div className="list-group">
              {m365Accounts.map(a => (
                <div key={a.id} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div className="font-semibold" style={{ fontSize: '1.05rem', color: 'var(--text)' }}>{a.displayName}</div>
                    <span className="badge badge-gray">{a.status}</span>
                  </div>
                  <div className="text-sm text-muted font-mono" style={{ marginBottom: '0.5rem' }}>{a.email}</div>
                  {a.assignedUser ? (
                    <div className="text-sm text-muted">Assigned to: <Link href={`/users/${a.assignedUser.id}`} style={{ color: 'var(--accent)' }}>{a.assignedUser.name}</Link></div>
                  ) : (
                    <div className="text-sm text-muted" style={{ fontStyle: 'italic' }}>Unassigned</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="table-empty" style={{ padding: '3rem' }}>No M365 accounts found.</div>
          )}
        </div>

        {/* Access Rights Card */}
        <div className="card" style={{ border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '1.5rem' }}>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Access Rights <span className="badge badge-yellow">{accessPoints.length}</span>
            </h3>
          </div>
          {accessPoints.length > 0 ? (
            <div className="list-group">
              {accessPoints.map(ap => (
                <div key={ap.id} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div className="font-semibold" style={{ fontSize: '1.05rem', color: 'var(--text)' }}>{ap.name}</div>
                    <span className="badge badge-gray">{ap.type}</span>
                  </div>
                  {ap.description && <div className="text-sm text-muted" style={{ lineHeight: 1.5 }}>{ap.description}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="table-empty" style={{ padding: '3rem' }}>No access rights found.</div>
          )}
        </div>

      </div>
    </div>
  )
}
