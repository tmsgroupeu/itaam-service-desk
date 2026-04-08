import prisma from '@/lib/prisma'
import { AccessClient } from './AccessClient'

export default async function AccessPage() {
  const [accessPoints, allUsers] = await Promise.all([
    prisma.accessPoint.findMany({ include: { users: { include: { user: true } } }, orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
    prisma.user.findMany({ orderBy: [{ department: 'asc' }, { name: 'asc' }] }),
  ])
  return <AccessClient accessPoints={accessPoints} allUsers={allUsers} />
}
