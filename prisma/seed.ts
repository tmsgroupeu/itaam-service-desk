import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clean slate
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.ticketComment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.log.deleteMany()
  await prisma.userAccess.deleteMany()
  await prisma.userAccount.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.accessPoint.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleared existing data...')

  // ── ACCESS POINTS ──────────────────────
  const ap = await Promise.all([
    prisma.accessPoint.create({ data: { name: 'info@company.com', type: 'Mailbox', description: 'General company mailbox' } }),
    prisma.accessPoint.create({ data: { name: 'accounts@company.com', type: 'Mailbox', description: 'Accounts payable mailbox' } }),
    prisma.accessPoint.create({ data: { name: 'crewing@company.com', type: 'Mailbox', description: 'Crew management mailbox' } }),
    prisma.accessPoint.create({ data: { name: 'sales@company.com', type: 'Mailbox', description: 'Sales team mailbox' } }),
    prisma.accessPoint.create({ data: { name: 'operations@company.com', type: 'Mailbox', description: 'Operations mailbox' } }),
    prisma.accessPoint.create({ data: { name: 'Ricoh IM C3010 – Customer Support', type: 'Printer', description: 'IP: 192.168.1.178' } }),
    prisma.accessPoint.create({ data: { name: 'Ricoh IM C8010 – Accounting', type: 'Printer', description: 'IP: 192.168.1.178' } }),
    prisma.accessPoint.create({ data: { name: 'Xerox VersaLink B7030', type: 'Printer', description: 'IP: 192.168.1.251 / MTP' } }),
    prisma.accessPoint.create({ data: { name: 'HP LaserJet P3102W', type: 'Printer', description: 'IP: 192.168.1.178' } }),
    prisma.accessPoint.create({ data: { name: 'Crewing SharePoint', type: 'SharePoint', description: 'Crew management document library' } }),
    prisma.accessPoint.create({ data: { name: 'HR File Server', type: 'FileServer', description: '\\\\fileserver\\HR' } }),
    prisma.accessPoint.create({ data: { name: 'Accounts File Server', type: 'FileServer', description: '\\\\fileserver\\Accounts' } }),
  ])

  const [mailInfo, mailAccounts, mailCrewing, mailSales, mailOps, printerCS, printerAccounting, printerXerox, printerHP, spCrewing, fsHR, fsAccounts] = ap

  console.log('✅ Created access points...')

  // ── USERS ─────────────────────────────────
  const names = [
    'Chrystostomos Syrimis', 'Maria Michaill', 'Christine Theodosiou', 'Andreas Hadjisfi', 'Sofia Christodoulou',
    'Nikolas Koromanos', 'Demetrios Auraniklis', 'Emina Diamandi', 'Marzena Anna Wladyha', 'Dumitru Alianchi',
    'Alexey Victor Kolerov', 'Italia Hadjiyiannis', 'Andreas Georgiou', 'Anna Loizou', 'Maria Pirou',
    'Fotis Vasilkou', 'Elena Michaelidou', 'Antigone Panayotou', 'Paris Ioannou', 'Georgios Tzimoulas',
    'Nicky Tilapou', 'Tasos D. Karasik'
  ]

  const usersData = Array.from({ length: 22 }, (_, i) => {
    const isIT = i < 2
    const name = names[i]
    return {
      name,
      department: i < 2 ? 'IT' : (i < 5 ? 'Finance' : (i < 10 ? 'Operations' : 'HR')),
      license: i < 5 ? 'M365 E3' : 'M365 Business Premium',
      mobileNumber: `+357 99 0000${i.toString().padStart(2, '0')}`,
      deskExtension: `100${i}`,
      role: isIT ? 'ADMIN' : 'EMPLOYEE',
      email: isIT ? (i === 0 ? process.env.TEST_ADMIN_EMAIL || `admin@company.com` : `tech@company.com`) : `${name.split(' ')[0].toLowerCase()[0]}.${name.split(' ')[1]?.toLowerCase()}@company.com`,
    }
  })

  const users = await Promise.all(usersData.map(u => prisma.user.create({ data: u })))

  const [userIT, userMaria, userChristine, userAndreas, userSofia, userNikolas, userDemos, userEmina, userMarzena, userDumitru, userAlexey, userItalia, userAndreasG, userAnna, userMariaP, userFotis, userElena, userAntigone, userParis, userGeorgios, userNicky, userTasos] = users

  console.log(`✅ Created ${users.length} users...`)

  // ── ASSETS ─────────────────────────────
  const assets = await Promise.all([
    // IT Admin
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'ThinkBook 13s Intel i5 – 16GB – 512GB SSD', serialImei: 'TB-SYR-001', status: 'Assigned', assignedUserId: userIT.id } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Monitor', brandModel: '2x AOC LCD Monitor', serialImei: 'GGZN7HA-IT01', status: 'Assigned', assignedUserId: userIT.id } }),
    // Front Desk
    prisma.asset.create({ data: { type: 'Serialized', category: 'Desktop', brandModel: 'HP Compaq 8200 Intel Core i5 – 8GB – 237GB SSD', serialImei: 'C2C24298LM', status: 'Assigned', assignedUserId: userMaria.id } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Monitor', brandModel: 'AOC LCD Monitor', serialImei: 'GGZN7HAS35978', status: 'Assigned', assignedUserId: userMaria.id } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Phone Console', brandModel: 'Yealink SIP-T31G', serialImei: 'YL-FD-001', status: 'Assigned', assignedUserId: userMaria.id } }),
    // Accounting
    prisma.asset.create({ data: { type: 'Serialized', category: 'Desktop', brandModel: 'ThinkCenter Intel Core i5 – 16GB – 512GB SSD', serialImei: '15682BMR3WLV9B7R62', status: 'Assigned', assignedUserId: userChristine.id } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Monitor', brandModel: 'ThinkVision Monitor', serialImei: 'TV-ACC-001', status: 'Assigned', assignedUserId: userChristine.id } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Desktop', brandModel: 'ThinkCenter Intel Core i5 – 16GB – 512GB SSD', serialImei: '15682BMR3WLV9C811', status: 'Assigned', assignedUserId: userAndreas.id } }),
    // Technical
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'Lenovo ThinkPad Intel Core i5 – 16GB – 237GB SSD', serialImei: 'TP-TECH-001', status: 'Assigned', assignedUserId: userDemos.id } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'Lenovo ThinkPad Intel Core i5 – 16GB – 237GB SSD', serialImei: 'TP-TECH-002', status: 'Assigned', assignedUserId: userEmina.id } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'Lenovo ThinkPad Intel Core i5 – 16GB – 237GB SSD', serialImei: 'TP-TECH-003', status: 'Assigned', assignedUserId: userAlexey.id } }),
    // Sales
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'ThinkCenter Intel Core i5 – 16GB – 512GB SSD', serialImei: 'TC-SALES-001', status: 'Assigned', assignedUserId: userItalia.id } }),
    // Management
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'ThinkBook 15 Intel Core i5 – 16GB – 512GB SSD', serialImei: 'TB-GM-001', status: 'Assigned', assignedUserId: userNicky.id } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Mobile', brandModel: 'Samsung Galaxy S23', serialImei: '351234567890123', status: 'Assigned', assignedUserId: userNicky.id } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'ThinkBook 15 Intel Core i7 – 32GB – 512GB SSD', serialImei: 'TB-COO-001', status: 'Assigned', assignedUserId: userTasos.id } }),
    // Customer Support
    prisma.asset.create({ data: { type: 'Serialized', category: 'Desktop', brandModel: 'ProDesk 400 G7 Intel Core i5 – 16GB – 512GB SSD', serialImei: 'PD-CS-001', status: 'Assigned', assignedUserId: userAnna.id } }),
    // Stock items (unassigned)
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'ThinkBook 13s Intel Core i5 – 8GB – 256GB SSD', serialImei: 'TB-STOCK-001', status: 'In Stock' } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'HP EliteBook 840 G8 Intel Core i5 – 16GB – 512GB SSD', serialImei: 'HP-STOCK-001', status: 'In Stock' } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Monitor', brandModel: 'Samsung 24" LCD Monitor', serialImei: 'SAM-STOCK-001', status: 'In Stock' } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Monitor', brandModel: 'AOC LCD Monitor 22"', serialImei: 'AOC-STOCK-001', status: 'In Stock' } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Phone Console', brandModel: 'Yealink SIP-T31G', serialImei: 'YL-STOCK-001', status: 'In Stock' } }),
    prisma.asset.create({ data: { type: 'Serialized', category: 'Laptop', brandModel: 'Dell Latitude 5520 i5 – 16GB – 256GB SSD', serialImei: 'DELL-BR-001', status: 'Broken', conditionComment: 'Screen damaged, sent to repair' } }),
    // Bulk Items
    prisma.asset.create({ data: { type: 'Bulk', category: 'Mouse', brandModel: 'Logicom M190 Wireless Mouse', status: 'In Stock', conditionComment: 'Qty: 8 in stock' } }),
    prisma.asset.create({ data: { type: 'Bulk', category: 'Keyboard', brandModel: 'Logicom USB Keyboard', status: 'In Stock', conditionComment: 'Qty: 5 in stock' } }),
    prisma.asset.create({ data: { type: 'Bulk', category: 'Headset', brandModel: '4Tech USB Headset HS-28', status: 'In Stock', conditionComment: 'Qty: 10 in stock' } }),
    prisma.asset.create({ data: { type: 'Bulk', category: 'Cable', brandModel: 'Cat6 Ethernet Patch Cable 2m', status: 'In Stock', conditionComment: 'Qty: 20 in stock' } }),
  ])

  console.log(`✅ Created ${assets.length} assets...`)

  // ── LOG ENTRIES for assigned assets ────
  const assignedAssets = assets.filter(a => a.assignedUserId)
  for (const asset of assignedAssets) {
    const user = users.find(u => u.id === asset.assignedUserId)
    if (user) {
      await prisma.log.create({
        data: { assetId: asset.id, userId: user.id, action: 'Assigned', notes: `Initial assignment to ${user.name}` }
      })
    }
  }

  console.log('✅ Created activity log entries...')

  const accountsData = users.map(u => ({
    userId: u.id,
    accountType: 'Corporate Email',
    username: `${u.name.split(' ')[0].toLowerCase()[0]}.${u.name.split(' ')[1]?.toLowerCase()}@company.com`,
    notes: 'Primary M365 account',
  }))
  
  // Add some VPNs and Teams accounts randomly
  users.slice(0, 5).forEach((u, i) => {
    accountsData.push({
      userId: u.id,
      accountType: 'VPN',
      username: `VPN-${u.name.split(' ')[0].toLowerCase()}`,
      notes: 'FortiClient access',
    })
    accountsData.push({
      userId: u.id,
      accountType: 'Teams',
      username: `+357 22 0000${i}`,
      notes: 'Direct dial assignment',
    })
  })

  for (const acc of accountsData) {
    await prisma.userAccount.create({ data: acc })
  }
  console.log('✅ Created user accounts...')

  // CREATE TICKETS
  const sampleTickets = [
    {
      title: 'Cannot connect to VPN',
      description: 'I am getting a credential error when trying to connect to FortiClient.',
      status: 'Open',
      priority: 'High',
      category: 'Network',
      authorId: users[1].id,
    },
    {
      title: 'Requesting extra monitor',
      description: 'Working on a large spreadsheet, need a second display please.',
      status: 'Resolved',
      priority: 'Low',
      category: 'Hardware',
      authorId: users[2].id,
    },
    {
      title: 'Password reset for ERP',
      description: 'Locked out of the ERP system after 3 failed attempts.',
      status: 'Closed',
      priority: 'Medium',
      category: 'Access',
      authorId: users[3].id,
    }
  ]

  for (const t of sampleTickets) {
    const ticket = await prisma.ticket.create({ data: t })
    if (t.status === 'Closed' || t.status === 'Resolved') {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          body: 'Issue resolved. Please let IT know if it happens again.',
          isAdmin: true,
        }
      })
    }
  }
  console.log('✅ Created sample tickets...')

  // ── USER ACCESS grants ──────────────────
  const grants: Array<[string, string]> = [
    // IT Admin gets everything
    [userIT.id, mailInfo.id], [userIT.id, mailAccounts.id], [userIT.id, mailCrewing.id], [userIT.id, mailSales.id], [userIT.id, printerXerox.id], [userIT.id, fsHR.id], [userIT.id, fsAccounts.id],
    // Front Desk
    [userMaria.id, mailInfo.id], [userMaria.id, printerCS.id],
    // Accounting
    [userChristine.id, mailAccounts.id], [userChristine.id, printerAccounting.id], [userChristine.id, fsAccounts.id],
    [userAndreas.id, mailAccounts.id], [userAndreas.id, printerAccounting.id], [userAndreas.id, fsAccounts.id],
    [userSofia.id, mailAccounts.id], [userSofia.id, printerAccounting.id],
    [userNikolas.id, mailAccounts.id], [userNikolas.id, printerAccounting.id],
    // Technical
    [userDemos.id, printerHP.id],
    [userEmina.id, printerHP.id],
    // Purchasing & Crew
    [userMarzena.id, mailCrewing.id], [userMarzena.id, spCrewing.id],
    [userDumitru.id, mailCrewing.id], [userDumitru.id, spCrewing.id],
    // Sales
    [userItalia.id, mailSales.id], [userItalia.id, printerXerox.id],
    [userAndreasG.id, mailSales.id],
    // Customer Support
    [userAnna.id, printerCS.id], [userMariaP.id, printerCS.id], [userFotis.id, printerCS.id], [userElena.id, printerCS.id],
    // Operations
    [userAntigone.id, mailOps.id], [userAntigone.id, printerXerox.id],
    // Management
    [userNicky.id, mailInfo.id], [userNicky.id, mailSales.id], [userNicky.id, printerXerox.id], [userNicky.id, fsHR.id],
    [userTasos.id, mailInfo.id], [userTasos.id, mailAccounts.id], [userTasos.id, printerXerox.id], [userTasos.id, fsHR.id], [userTasos.id, fsAccounts.id],
  ]

  for (const [uid, apid] of grants) {
    await prisma.userAccess.upsert({
      where: { userId_accessPointId: { userId: uid, accessPointId: apid } },
      create: { userId: uid, accessPointId: apid },
      update: {},
    })
  }

  console.log(`✅ Granted ${grants.length} access permissions...`)
  console.log('\n🎉 Seed complete! Database is ready.')
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
