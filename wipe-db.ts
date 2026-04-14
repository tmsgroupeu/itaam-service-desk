import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Unassigning assets and accounts...')
  await prisma.asset.updateMany({ data: { assignedUserId: null, status: 'In Stock' } })
  await prisma.m365Account.updateMany({ data: { assignedUserId: null, usageType: null } })
  
  console.log('Deleting dependent entities...')
  await prisma.ticketComment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.userAccess.deleteMany()
  await prisma.userAccount.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  
  console.log('Deleting users...')
  const result = await prisma.user.deleteMany()
  console.log(`Successfully wiped ${result.count} users!`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
