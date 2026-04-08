import prisma from '@/lib/prisma'
import { TicketsClient } from './TicketsClient'

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    include: {
      author: true,
      comments: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return <TicketsClient tickets={tickets} />
}
