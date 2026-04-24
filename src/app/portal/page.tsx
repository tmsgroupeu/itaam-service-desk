import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PortalClient } from './PortalClient'


export default async function PortalPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/api/auth/signin')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      assets: true,
      accessPoints: { include: { accessPoint: true } },
      tickets: { orderBy: { updatedAt: 'desc' } },
    }
  })

  // If user is logged in via MS but not in DB, deny access or show message.
  if (!user) {
    return (
      <div className="empty-state">
        Your email ({session.user.email}) is not registered in the IT Directory.
        Please contact your IT Administrator.
      </div>
    )
  }

  return <PortalClient user={user as any} />
}
