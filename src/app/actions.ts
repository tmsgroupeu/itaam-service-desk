'use server'

import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/mailer'
import prisma from '@/lib/prisma'

// ── USERS ──────────────────────────────────

export async function createUser(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  if (!name) throw new Error('Name is required')

  const user = await prisma.user.create({
    data: {
      name,
      department: (formData.get('department') as string) || null,
      license: (formData.get('license') as string) || null,
      mobileNumber: (formData.get('mobileNumber') as string) || null,
      deskExtension: (formData.get('deskExtension') as string) || null,
      airportExtension: (formData.get('airportExtension') as string) || null,
    },
  })
  revalidatePath('/users')
  return { success: true, userId: user.id }
}

export async function updateUser(userId: string, formData: FormData) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: (formData.get('name') as string).trim(),
      department: (formData.get('department') as string) || null,
      license: (formData.get('license') as string) || null,
      mobileNumber: (formData.get('mobileNumber') as string) || null,
      deskExtension: (formData.get('deskExtension') as string) || null,
      airportExtension: (formData.get('airportExtension') as string) || null,
    },
  })
  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { success: true }
}

export async function deleteUser(userId: string) {
  await prisma.asset.updateMany({
    where: { assignedUserId: userId },
    data: { assignedUserId: null, status: 'In Stock' },
  })
  await prisma.log.deleteMany({ where: { userId } })
  await prisma.userAccess.deleteMany({ where: { userId } })
  await prisma.userAccount.deleteMany({ where: { userId } })
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/users')
  return { success: true }
}

// ── USER ACCOUNTS ───────────────────────────

export async function createUserAccount(userId: string, formData: FormData) {
  await prisma.userAccount.create({
    data: {
      userId,
      accountType: formData.get('accountType') as string,
      username: (formData.get('username') as string).trim(),
      notes: (formData.get('notes') as string) || null,
    },
  })
  revalidatePath(`/users/${userId}`)
  return { success: true }
}

export async function updateUserAccount(accountId: string, userId: string, formData: FormData) {
  await prisma.userAccount.update({
    where: { id: accountId },
    data: {
      accountType: formData.get('accountType') as string,
      username: (formData.get('username') as string).trim(),
      notes: (formData.get('notes') as string) || null,
    },
  })
  revalidatePath(`/users/${userId}`)
  return { success: true }
}

export async function deleteUserAccount(accountId: string, userId: string) {
  await prisma.userAccount.delete({ where: { id: accountId } })
  revalidatePath(`/users/${userId}`)
  return { success: true }
}


// ── ASSETS ─────────────────────────────────

export async function createAsset(formData: FormData) {
  await prisma.asset.create({
    data: {
      type: (formData.get('type') as string) || 'Serialized',
      category: formData.get('category') as string,
      brandModel: formData.get('brandModel') as string,
      serialImei: (formData.get('serialImei') as string) || null,
      conditionComment: (formData.get('conditionComment') as string) || null,
      status: 'In Stock',
    },
  })
  revalidatePath('/hardware')
  return { success: true }
}

export async function updateAsset(assetId: string, formData: FormData) {
  await prisma.asset.update({
    where: { id: assetId },
    data: {
      type: formData.get('type') as string,
      category: formData.get('category') as string,
      brandModel: formData.get('brandModel') as string,
      serialImei: (formData.get('serialImei') as string) || null,
      conditionComment: (formData.get('conditionComment') as string) || null,
    },
  })
  revalidatePath('/hardware')
  return { success: true }
}

export async function assignAsset(assetId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  await prisma.asset.update({
    where: { id: assetId },
    data: { assignedUserId: userId, status: 'Assigned' },
  })
  await prisma.log.create({
    data: { assetId, userId, action: 'Assigned', notes: `Assigned to ${user.name}` },
  })
  revalidatePath('/hardware')
  revalidatePath(`/users/${userId}`)
  revalidatePath('/users')
  return { success: true }
}

export async function unassignAsset(assetId: string, newStatus: string = 'In Stock') {
  const asset = await prisma.asset.findUnique({ where: { id: assetId }, include: { assignedUser: true } })
  if (!asset) throw new Error('Asset not found')

  await prisma.asset.update({
    where: { id: assetId },
    data: { assignedUserId: null, status: newStatus },
  })
  await prisma.log.create({
    data: {
      assetId,
      userId: asset.assignedUserId,
      action: 'Returned',
      notes: asset.assignedUser ? `Returned by ${asset.assignedUser.name} → ${newStatus}` : `Status → ${newStatus}`,
    },
  })
  revalidatePath('/hardware')
  revalidatePath('/users')
  if (asset.assignedUserId) revalidatePath(`/users/${asset.assignedUserId}`)
  return { success: true }
}

export async function swapDevice(oldAssetId: string, newAssetId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  await prisma.asset.update({ where: { id: oldAssetId }, data: { assignedUserId: null, status: 'Pending Return' } })
  await prisma.log.create({ data: { assetId: oldAssetId, userId, action: 'Pending Return', notes: `Device swap – returned by ${user.name}` } })

  await prisma.asset.update({ where: { id: newAssetId }, data: { assignedUserId: userId, status: 'Assigned' } })
  await prisma.log.create({ data: { assetId: newAssetId, userId, action: 'Assigned (Swap)', notes: `Replacement assigned to ${user.name}` } })

  revalidatePath('/hardware')
  revalidatePath(`/users/${userId}`)
  return { success: true }
}

export async function updateAssetStatus(assetId: string, status: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error('Not found')
  if (status !== 'In Stock' && status !== 'Broken' && status !== 'Retired' && status !== 'Pending Return' && status !== 'Assigned') throw new Error('Invalid status')
  await prisma.asset.update({ where: { id: assetId }, data: { status } })
  await prisma.log.create({ data: { assetId, action: 'Status Change', notes: `Status → ${status}` } })
  revalidatePath('/hardware')
  return { success: true }
}

export async function deleteAsset(assetId: string) {
  await prisma.log.deleteMany({ where: { assetId } })
  await prisma.asset.delete({ where: { id: assetId } })
  revalidatePath('/hardware')
  return { success: true }
}

// ── ACCESS POINTS ───────────────────────────

export async function createAccessPoint(formData: FormData) {
  await prisma.accessPoint.create({
    data: {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      description: (formData.get('description') as string) || null,
    },
  })
  revalidatePath('/access')
  return { success: true }
}

export async function deleteAccessPoint(accessPointId: string) {
  await prisma.userAccess.deleteMany({ where: { accessPointId } })
  await prisma.accessPoint.delete({ where: { id: accessPointId } })
  revalidatePath('/access')
  return { success: true }
}

// ── USER ACCESS ─────────────────────────────

export async function grantAccess(userId: string, accessPointId: string) {
  await prisma.userAccess.upsert({
    where: { userId_accessPointId: { userId, accessPointId } },
    create: { userId, accessPointId },
    update: {},
  })
  revalidatePath('/access')
  revalidatePath(`/users/${userId}`)
  return { success: true }
}

export async function revokeAccess(userId: string, accessPointId: string) {
  await prisma.userAccess.deleteMany({
    where: { userId, accessPointId },
  })
  revalidatePath('/access')
  revalidatePath(`/users/${userId}`)
  return { success: true }
}

// ── WORKFLOWS ───────────────────────────────

export async function completeOnboarding(userId: string, assetIds: string[], accessPointIds: string[]) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  for (const assetId of assetIds) {
    await prisma.asset.update({ where: { id: assetId }, data: { assignedUserId: userId, status: 'Assigned' } })
    await prisma.log.create({ data: { assetId, userId, action: 'Assigned (Onboarding)', notes: `Onboarding: assigned to ${user.name}` } })
  }

  for (const accessPointId of accessPointIds) {
    await prisma.userAccess.upsert({
      where: { userId_accessPointId: { userId, accessPointId } },
      create: { userId, accessPointId },
      update: {},
    })
  }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  revalidatePath('/hardware')
  revalidatePath('/access')
  return { success: true, userId }
}

export async function completeOffboarding(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { assets: true },
  })
  if (!user) throw new Error('User not found')

  for (const asset of user.assets) {
    await prisma.asset.update({ where: { id: asset.id }, data: { assignedUserId: null, status: 'In Stock' } })
    await prisma.log.create({ data: { assetId: asset.id, userId, action: 'Returned (Offboarding)', notes: `Offboarding: returned by ${user.name}` } })
  }

  await prisma.userAccess.deleteMany({ where: { userId } })

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  revalidatePath('/hardware')
  revalidatePath('/access')
  return { success: true }
}

// ── TICKETS ───────────────────────────────

export async function createTicket(formData: FormData) {
  const authorId = formData.get('authorId') as string
  const assetId = (formData.get('assetId') as string) || null

  const ticket = await prisma.ticket.create({
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as string,
      category: formData.get('category') as string,
      authorId,
      assetId,
    },
  })

  // Add initial comment if provided
  const initialComment = formData.get('comment') as string
  if (initialComment) {
    await prisma.ticketComment.create({
      data: {
        ticketId: ticket.id,
        body: initialComment,
        isAdmin: authorId !== user.id, // Only true if an admin created it on their behalf
      },
    })
  }

  // Notify Admin
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@company.com'
  await sendEmail({
    to: adminEmail,
    subject: `New Ticket: ${ticket.title} [${ticket.priority}]`,
    html: `<h3>New Service Desk Ticket</h3><p><strong>Category:</strong> ${ticket.category}</p><p><strong>Priority:</strong> ${ticket.priority}</p><p><strong>Description:</strong><br/>${ticket.description}</p><p>Requested by: ${user?.name}</p><br/><a href="${process.env.NEXTAUTH_URL}/tickets/${ticket.id}">View Ticket</a>`
  })

  revalidatePath('/tickets')
  revalidatePath(`/users/${authorId}`)
  return { success: true, ticketId: ticket.id }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status },
    include: { author: true }
  })
  
  await prisma.ticketComment.create({
    data: {
      ticketId,
      body: `Status changed to: ${status}`,
      isAdmin: true,
    },
  })

  if (ticket.author.email) {
    await sendEmail({
      to: ticket.author.email,
      subject: `Ticket Update: ${ticket.title} is now ${status}`,
      html: `<p>Hello ${ticket.author.name},</p><p>Your support ticket "<strong>${ticket.title}</strong>" status has been updated to: <strong>${status}</strong>.</p><br/><a href="${process.env.NEXTAUTH_URL}/portal/tickets/${ticket.id}">View Ticket Details</a>`
    })
  }

  revalidatePath('/tickets')
  revalidatePath(`/tickets/${ticketId}`)
  revalidatePath(`/users/${ticket.authorId}`)
  return { success: true }
}

export async function addTicketComment(ticketId: string, formData: FormData) {
  const body = (formData.get('body') as string).trim()
  const isAdmin = formData.get('isAdmin') === 'true'
  if (!body) return { success: false }

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId,
      body,
      isAdmin,
    },
  })

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { author: true } })
  
  if (ticket) {
    if (isAdmin && ticket.author.email) {
       // IT responded -> Email employee
       await sendEmail({
         to: ticket.author.email,
         subject: `New response on ticket: ${ticket.title}`,
         html: `<p>Log in to view the response from IT Support.</p><p><strong>Response:</strong><br/>${body}</p><br/><a href="${process.env.NEXTAUTH_URL}/portal/tickets/${ticket.id}">View Ticket</a>`
       })
    } else if (!isAdmin) {
       // Employee responded -> Email IT
       const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@company.com'
       await sendEmail({
         to: adminEmail,
         subject: `New response from ${ticket.author.name} on ticket: ${ticket.title}`,
         html: `<p>User has replied.</p><p><strong>Response:</strong><br/>${body}</p><br/><a href="${process.env.NEXTAUTH_URL}/tickets/${ticket.id}">View Ticket in Service Desk</a>`
       })
    }
  }

  revalidatePath(`/tickets/${ticketId}`)
  return { success: true }
}

// ── BULK OPERATIONS ──────────────────────────

export async function importUsersFromCSV(rows: Record<string, string>[]) {
  let imported = 0
  let skipped = 0

  for (const row of rows) {
    const email = row['User principal name']?.trim() || row['User Principal Name']?.trim()
    const name = row['Display name']?.trim() || row['Display Name']?.trim()
    
    // Skip if invalid or a generic/service account like "info@", "sales@", "accounting@"
    if (!email || !name) {
      skipped++
      continue
    }

    // Skip well-known generic accounts if they look like system mapping instead of real users
    // If the user wants them, they can manually add them later. But let's allow them for now unless they start with specific words
    
    // Extract other fields
    let department: string | undefined = row['Department']?.trim()
    if (!department) department = undefined
    
    let mobileNumber: string | undefined = row['Mobile Phone']?.trim()
    if (!mobileNumber) mobileNumber = undefined

    // Example licenses column format: "Exchange Online (Plan 1)+Exchange Online Archiving for Exchange Online"
    let license: string | undefined = row['Licenses']?.trim()
    if (!license || license === 'Unlicensed') license = undefined
    // We can clean up the license string to just be the first one, or "Unlicensed"
    if (license?.includes('+')) {
      license = license.split('+')[0]
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existing) {
      // We could update them here, but for now we skip duplicates to be safe
      skipped++
      continue
    }

    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        department,
        mobileNumber,
        license,
        role: 'EMPLOYEE',
      }
    })

    imported++
  }

  revalidatePath('/users')
  return { success: true, imported, skipped }
}
