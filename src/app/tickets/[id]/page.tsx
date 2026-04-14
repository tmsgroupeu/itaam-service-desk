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

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, department: true },
    orderBy: { name: 'asc' }
  })

  return <TicketDetailClient ticket={ticket} users={allUsers} />
}
