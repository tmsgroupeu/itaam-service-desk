import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_WIPE) {
    return NextResponse.json({ error: 'Wipe disabled in production. Set ALLOW_WIPE=true in Vercel to use this.' }, { status: 403 })
  }

  try {
    // Unassign assets and M365 accounts first
    await prisma.asset.updateMany({ data: { assignedUserId: null, status: 'In Stock' } })
    await prisma.m365Account.updateMany({ data: { assignedUserId: null, usageType: null } })
    
    // Delete dependent rows
    await prisma.ticketComment.deleteMany()
    await prisma.ticket.deleteMany()
    await prisma.userAccess.deleteMany()
    await prisma.userAccount.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    
    // Delete users
    const result = await prisma.user.deleteMany()
    
    return NextResponse.json({ message: `Successfully wiped ${result.count} users and reset all assets. Please delete this endpoint after testing!` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
