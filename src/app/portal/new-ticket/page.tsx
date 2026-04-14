import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NewTicketClient } from './NewTicketClient'

export default async function NewTicketPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/api/auth/signin')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      assets: true
    }
  })

  if (!user) {
    return (
      <div className="empty-state">
        Your email ({session.user.email}) is not registered in the IT Directory.
        Please contact your IT Administrator.
      </div>
    )
  }

  return <NewTicketClient authorId={user.id} userAssets={user.assets} />
}
