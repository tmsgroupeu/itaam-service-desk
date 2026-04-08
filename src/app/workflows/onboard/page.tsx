import prisma from '@/lib/prisma'
import { OnboardWizard } from './OnboardWizard'

export default async function OnboardPage() {
  const [users, stockAssets, accessPoints] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ department: 'asc' }, { name: 'asc' }] }),
    prisma.asset.findMany({ where: { status: 'In Stock' }, orderBy: [{ category: 'asc' }, { brandModel: 'asc' }] }),
    prisma.accessPoint.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
  ])
  return <OnboardWizard users={users} stockAssets={stockAssets} accessPoints={accessPoints} />
}
