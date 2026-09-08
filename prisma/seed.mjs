import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing slots (optional, for idempotency in dev)
  await prisma.appointment.deleteMany({});
  await prisma.slot.deleteMany({});
  await prisma.user.deleteMany({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots = [];
  
  // Generate slots for the next 7 days
  for (let day = 1; day <= 7; day++) {
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() + day);

    // Skip weekends (optional, let's just make it everyday for simplicity)
    
    // Slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      const startTime = new Date(currentDay);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(currentDay);
      endTime.setHours(hour + 1, 0, 0, 0);

      slots.push({
        startTime,
        endTime,
        isBooked: false
      });
    }
  }

  await prisma.slot.createMany({
    data: slots
  });

  console.log(`Successfully created ${slots.length} slots.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
