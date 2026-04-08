import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

export default async function PortalPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/api/auth/signin')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      assets: true,
      accessPoints: { include: { accessPoint: true } },
      tickets: { orderBy: { updatedAt: 'desc' } },
    }
  })

  // If user is logged in via MS but not in DB, deny access or show message.
  if (!user) {
    return (
      <div className="empty-state">
        Your email ({session.user.email}) is not registered in the IT Directory.
        Please contact your IT Administrator.
      </div>
    )
  }

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Welcome, {user.name.split(' ')[0]}</h1>
          <div className="text-sm text-muted">Use this portal to view your assigned equipment and manage IT support requests.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Hardware Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="section-title">My Equipment</h3>
            </div>
            {user.assets.length === 0 ? (
              <div className="table-empty">No hardware assigned.</div>
            ) : (
              <table className="data-table">
                <tbody>
                  {user.assets.map(asset => (
                    <tr key={asset.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{asset.category}</div>
                        <div className="text-xs text-muted">{asset.brandModel}</div>
                      </td>
                      <td className="text-right">
                        {asset.serialImei && <span className="font-mono text-xs">{asset.serialImei}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Access Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="section-title">Digital Access</h3>
            </div>
            {user.accessPoints.length === 0 ? (
              <div className="table-empty">No digital access granted.</div>
            ) : (
              <table className="data-table">
                <tbody>
                  {user.accessPoints.map(ua => (
                    <tr key={ua.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ua.accessPoint.name}</div>
                      </td>
                      <td className="text-right text-xs text-muted">
                        Granted {new Date(ua.grantedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tickets Section */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 className="section-title">My Support Tickets</h3>
            {/* Real link to a self-service ticket creation form to be built later if necessary, for now redirect or modal */}
            <Link href="/portal/new-ticket" className="btn btn-primary btn-sm">+ New Ticket</Link>
          </div>
          {user.tickets.length === 0 ? (
            <div className="table-empty">You have no past or active support requests.</div>
          ) : (
            <div className="list-group">
              {user.tickets.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                      <Link href={`/portal/tickets/${t.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{t.title}</Link>
                    </div>
                    <div className="text-xs text-muted">Opened {new Date(t.createdAt).toLocaleDateString()} • {t.category}</div>
                  </div>
                  <div>
                    <span className={statusColor(t.status)}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
