import prisma from '@/lib/prisma'
import { OffboardChecklist } from './OffboardChecklist'

export default async function OffboardPage() {
  const users = await prisma.user.findMany({
    include: {
      assets: { orderBy: { category: 'asc' } },
      accessPoints: { include: { accessPoint: true }, orderBy: { grantedAt: 'desc' } },
    },
    orderBy: [{ department: 'asc' }, { name: 'asc' }],
  })
  return <OffboardChecklist users={users} />
}
