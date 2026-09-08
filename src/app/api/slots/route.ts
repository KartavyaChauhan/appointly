import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
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
