import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("Fetching users...");
  const users = await prisma.user.findMany();
  console.log("Current users:", users.map(u => ({ email: u.email, role: u.role, id: u.id })));
  
  const res = await prisma.user.updateMany({ data: { role: 'ADMIN' } });
  console.log(`Updated ${res.count} users to ADMIN`);
  
  const updated = await prisma.user.findMany();
  console.log("New config:", updated.map(u => ({ email: u.email, role: u.role })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
