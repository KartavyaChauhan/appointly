import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function ensureSlotsExist() {
  const count = await prisma.slot.count();
  if (count === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slots = [];
    for (let day = 1; day <= 7; day++) {
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() + day);
      for (let hour = 9; hour < 17; hour++) {
        const startTime = new Date(currentDay);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = new Date(currentDay);
        endTime.setHours(hour + 1, 0, 0, 0);
        slots.push({ startTime, endTime, isBooked: false });
      }
    }
    await prisma.slot.createMany({ data: slots });
  }
}

export async function GET(request: Request) {
  try {
    await ensureSlotsExist();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let dateFilter = {};
    if (dateParam) {
      const startOfDay = new Date(dateParam);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateParam);
      endOfDay.setHours(23, 59, 59, 999);

      dateFilter = {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    }

    const slots = await prisma.slot.findMany({
      where: {
        ...dateFilter,
        startTime: {
          gt: new Date(), // Only future slots
        }
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}
