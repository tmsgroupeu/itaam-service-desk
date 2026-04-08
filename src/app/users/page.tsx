import prisma from '@/lib/prisma'
import { UsersClient } from './UsersClient'

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: { assets: true, accessPoints: true },
    orderBy: [{ department: 'asc' }, { name: 'asc' }],
  })
  return <UsersClient users={users} />
}
