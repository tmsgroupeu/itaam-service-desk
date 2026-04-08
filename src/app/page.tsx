import prisma from '@/lib/prisma'
import Link from 'next/link'

export default async function Dashboard() {
  const [userCount, totalAssets, inStock, assigned, broken, accessPoints] = await Promise.all([
    prisma.user.count(),
    prisma.asset.count(),
    prisma.asset.count({ where: { status: 'In Stock' } }),
    prisma.asset.count({ where: { status: 'Assigned' } }),
    prisma.asset.count({ where: { status: 'Broken' } }),
    prisma.accessPoint.count(),
  ])

  const byDept = await prisma.user.groupBy({ by: ['department'], _count: { _all: true }, orderBy: { _count: { department: 'desc' } } })
  const byCategory = await prisma.asset.groupBy({ by: ['category'], _count: { _all: true }, where: { type: 'Serialized' }, orderBy: { _count: { category: 'desc' } } })
  const recentLogs = await prisma.log.findMany({ take: 6, orderBy: { timestamp: 'desc' }, include: { asset: true, user: true } })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="btn-group">
          <Link href="/workflows/onboard" className="btn btn-primary">+ New Onboarding</Link>
          <Link href="/workflows/offboard" className="btn btn-secondary">Offboarding</Link>
        </div>
      </div>

      {/* Stat Row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Employees</div>
          <div className="stat-value">{userCount}</div>
          <div className="stat-sub">Active users tracked</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Assets Assigned</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{assigned}</div>
          <div className="stat-sub">of {totalAssets} total assets</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Stock</div>
          <div className="stat-value">{inStock}</div>
          <div className="stat-sub">Ready to assign</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Broken / Repair</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{broken}</div>
          <div className="stat-sub">Require attention</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Access Endpoints</div>
          <div className="stat-value" style={{ color: 'var(--purple)' }}>{accessPoints}</div>
          <div className="stat-sub">Mailboxes, printers, shares</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Users by Dept */}
        <div className="card card-p">
          <div className="section-title">Users by Department</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {byDept.slice(0, 8).map(d => (
              <div key={d.department ?? 'Unknown'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm">{d.department ?? 'Unassigned'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: `${Math.min((d._count._all / userCount) * 120, 120)}px`, height: '6px', background: 'var(--accent)', borderRadius: '3px', opacity: 0.7 }} />
                  <span className="text-xs text-muted">{d._count._all}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assets by Category */}
        <div className="card card-p">
          <div className="section-title">Assets by Category</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {byCategory.map(c => (
              <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm">{c.category}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: `${Math.min((c._count._all / totalAssets) * 120, 120)}px`, height: '6px', background: 'var(--green)', borderRadius: '3px', opacity: 0.7 }} />
                  <span className="text-xs text-muted">{c._count._all}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card card-p">
          <div className="section-title">Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <Link href="/workflows/onboard" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
              New Employee Onboarding
            </Link>
            <Link href="/workflows/offboard" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Initiate Offboarding
            </Link>
            <Link href="/hardware" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Add Hardware Asset
            </Link>
            <Link href="/access" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Manage Access Rights
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card card-p">
        <div className="section-title">Recent Activity Log</div>
        <div className="timeline">
          {recentLogs.length === 0 && <p className="text-muted text-sm">No activity yet.</p>}
          {recentLogs.map((log, i) => {
            const isAssign = log.action.toLowerCase().includes('assign')
            const isReturn = log.action.toLowerCase().includes('return')
            return (
              <div key={log.id} className="timeline-item">
                {i < recentLogs.length - 1 && <div className="timeline-line" />}
                <div className={`timeline-dot ${isAssign ? 'green' : isReturn ? 'yellow' : ''}`} />
                <div className="timeline-content">
                  <div className="timeline-action">{log.action} — <span style={{ color: 'var(--foreground-muted)' }}>{log.asset.category}: {log.asset.brandModel}</span></div>
                  {log.notes && <div className="timeline-notes">{log.notes}</div>}
                  <div className="timeline-time">{new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
