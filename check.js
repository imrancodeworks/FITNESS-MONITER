const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tables in public schema:', tables.map(t => t.tablename));

    const locks = await prisma.$queryRaw`SELECT pid, locktype, mode, granted FROM pg_locks WHERE locktype = 'advisory'`;
    console.log('Advisory locks:', locks);
  } catch (err) {
    console.error('Error connecting or querying:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
