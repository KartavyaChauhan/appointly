const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const total = await prisma.slot.count();
    const future = await prisma.slot.count({
      where: { startTime: { gt: new Date() } }
    });
    console.log('Total slots:', total);
    console.log('Future slots:', future);
    
    const first = await prisma.slot.findFirst({ orderBy: { startTime: 'asc' }});
    console.log('First slot:', first);
  } finally {
    await prisma.$disconnect();
  }
}
check();
