import { PrismaClient } from '@prisma/client'

const regions = [
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-south-1',
  'ca-central-1',
  'af-south-1',
  'me-central-1'
]

const pass = 'Amenevents%401212'
const ref = 'hwvhqeduqsktxmvqutzx'

async function testRegion(region) {
  const url = `postgresql://postgres.${ref}:${pass}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  })
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    console.log(`\nSUCCESS: Region ${region} connected!`, result)
    await prisma.$disconnect()
    return true
  } catch (err) {
    await prisma.$disconnect()
    return false
  }
}

async function run() {
  console.log('Testing regions for Supabase pooler...')
  for (const r of regions) {
    process.stdout.write(`Testing ${r}... `)
    const ok = await testRegion(r)
    if (ok) {
      console.log(`Found working region: ${r}!`)
      process.exit(0)
    } else {
      console.log('No')
    }
  }
  console.log('No region connected.')
}

run()

