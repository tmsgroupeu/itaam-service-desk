import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UserProfileClient } from './UserProfileClient'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      assets: { orderBy: { category: 'asc' } },
      accessPoints: { include: { accessPoint: true }, orderBy: { grantedAt: 'desc' } },
      userAccounts: { orderBy: { createdAt: 'desc' } },
      tickets: { orderBy: { updatedAt: 'desc' } },
      logs: { orderBy: { timestamp: 'desc' }, take: 20, include: { asset: true } },
    },
  })

  if (!user) notFound()

  const stockAssets = await prisma.asset.findMany({
    where: { status: 'In Stock' },
    orderBy: [{ category: 'asc' }, { brandModel: 'asc' }],
  })
  const allAccessPoints = await prisma.accessPoint.findMany({ orderBy: { name: 'asc' } })
  const grantedIds = user.accessPoints.map(ua => ua.accessPointId)

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/users" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to User Directory
        </Link>
      </div>
      <UserProfileClient
        user={user}
        stockAssets={stockAssets}
        allAccessPoints={allAccessPoints}
        grantedIds={grantedIds}
      />
    </div>
  )
}
