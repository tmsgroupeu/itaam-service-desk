import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { TicketDetailClient } from '@/app/tickets/[id]/TicketDetailClient'

export default async function PortalTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) redirect('/api/auth/signin')

  const { id } = await params

  // Verify the ticket belongs to the logged in user
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      author: true,
      asset: true,
      comments: { orderBy: { createdAt: 'asc' } },
    },
  })

  // If ticket doesn't exist, or doesn't belong to the logged-in user (unless they are admin, but this is the portal route)
  if (!ticket || ticket.author.email !== session.user.email) {
    notFound()
  }

  return <TicketDetailClient ticket={ticket} isPortalView={true} />
}
