import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Wiping all users and related dependent records...')
  
  // Unassign assets and M365 accounts first
  await prisma.asset.updateMany({ data: { assignedUserId: null, status: 'In Stock' } })
  await prisma.m365Account.updateMany({ data: { assignedUserId: null } })
  
  // Delete dependent rows
  await prisma.ticketComment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.userAccess.deleteMany()
  await prisma.userAccount.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  
  // Delete users
  const deleteUsers = await prisma.user.deleteMany()
  console.log(`Deleted ${deleteUsers.count} users.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
