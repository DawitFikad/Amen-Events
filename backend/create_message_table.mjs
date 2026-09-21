import { PrismaClient } from '@prisma/client'

const pass = 'Amenevents%401212'
const ref = 'hwvhqeduqsktxmvqutzx'
const url = `postgresql://postgres.${ref}:${pass}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`

const prisma = new PrismaClient({
  datasources: { db: { url } },
})

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL via Prisma...')

    // 1. Create Message table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Message" (
        "id" TEXT PRIMARY KEY,
        "senderId" TEXT,
        "senderName" TEXT NOT NULL,
        "senderRole" TEXT NOT NULL DEFAULT 'client',
        "recipientRole" TEXT NOT NULL DEFAULT 'all',
        "recipientId" TEXT,
        "eventId" TEXT,
        "text" TEXT NOT NULL,
        "attachmentUrl" TEXT DEFAULT '',
        "attachmentName" TEXT DEFAULT '',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    console.log('Message table ensured.')

    // 2. Grant access
    await prisma.$executeRawUnsafe(`GRANT ALL ON "Message" TO anon, authenticated, service_role;`)
    console.log('Permissions granted on Message table.')

    // 3. Set replica identity full
    await prisma.$executeRawUnsafe(`ALTER TABLE "Message" REPLICA IDENTITY FULL;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Notification" REPLICA IDENTITY FULL;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "ApprovalRequest" REPLICA IDENTITY FULL;`)
    console.log('Replica identity set to FULL.')

    // 4. Realtime publication
    try {
      await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "Message";`)
      console.log('Added Message to supabase_realtime.')
    } catch (e) {
      console.log('Message publication notice:', e.message)
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";`)
      console.log('Added Notification to supabase_realtime.')
    } catch (e) {
      console.log('Notification publication notice:', e.message)
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "ApprovalRequest";`)
      console.log('Added ApprovalRequest to supabase_realtime.')
    } catch (e) {
      console.log('ApprovalRequest publication notice:', e.message)
    }

    console.log('Database setup complete!')
    await prisma.$disconnect()
  } catch (err) {
    console.error('Migration error:', err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

run()
