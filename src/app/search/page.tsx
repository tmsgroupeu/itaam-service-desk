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

  // Simple global search over Users and Assets
  const [users, assets] = await Promise.all([
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
        ]
      },
      include: { assignedUser: true }
    })
  ])

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="page-title" style={{ marginBottom: '2rem' }}>Search Results for "{query}"</h1>

      <div style={{ display: 'grid', gap: '2rem' }}>
        <div className="card">
          <div className="card-header"><h3 className="section-title">Employees ({users.length})</h3></div>
          {users.length > 0 ? (
            <div className="list-group">
              {users.map(u => (
                <div key={u.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <Link href={`/users/${u.id}`} className="font-semibold" style={{ color: 'var(--accent)' }}>{u.name}</Link>
                  <div className="text-sm text-muted">{u.email} • {u.department ?? 'No Dept'}</div>
                </div>
              ))}
            </div>
          ) : (
             <div className="table-empty">No employees found.</div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3 className="section-title">Hardware ({assets.length})</h3></div>
          {assets.length > 0 ? (
            <div className="list-group">
              {assets.map(a => (
                <div key={a.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div className="font-semibold">{a.category}: {a.brandModel}</div>
                  <div className="text-sm text-muted">
                    {a.serialImei ? `S/N: ${a.serialImei} • ` : ''}
                    Status: <span className="badge badge-gray" style={{ display: 'inline-block' }}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-empty">No hardware found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
