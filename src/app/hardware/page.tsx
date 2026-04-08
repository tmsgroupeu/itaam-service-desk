import prisma from '@/lib/prisma'
import { HardwareClient } from './HardwareClient'

export default async function HardwarePage() {
  const [assets, users] = await Promise.all([
    prisma.asset.findMany({ include: { assignedUser: true }, orderBy: [{ status: 'asc' }, { category: 'asc' }] }),
    prisma.user.findMany({ orderBy: [{ department: 'asc' }, { name: 'asc' }] }),
  ])
  return <HardwareClient assets={assets} users={users} />
}
