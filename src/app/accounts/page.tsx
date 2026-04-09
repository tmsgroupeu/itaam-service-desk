import prisma from '@/lib/prisma'
import { AccountsClient } from './AccountsClient'

export default async function AccountsPage() {
  const accounts = await prisma.m365Account.findMany({
    include: { assignedUser: true },
    orderBy: { displayName: 'asc' },
  })

  return <AccountsClient accounts={accounts} />
}
