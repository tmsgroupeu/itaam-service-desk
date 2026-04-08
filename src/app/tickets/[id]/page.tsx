import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { TicketDetailClient } from './TicketDetailClient'

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      author: true,
      asset: true,
      comments: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!ticket) notFound()

  return <TicketDetailClient ticket={ticket} />
}
