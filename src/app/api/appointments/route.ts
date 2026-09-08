import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, slotId } = body;

    if (!name || !email || !slotId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a 6-character reference ID
    const referenceId = randomBytes(3).toString('hex').toUpperCase();

    // Use a transaction to prevent double booking
    const appointment = await prisma.$transaction(async (tx) => {
      // 1. Try to mark the slot as booked
      const updatedSlots = await tx.slot.updateMany({
        where: { id: slotId, isBooked: false },
        data: { isBooked: true }
      });

      // If 0 records updated, the slot was already booked or doesn't exist
      if (updatedSlots.count === 0) {
        throw new Error('SLOT_TAKEN');
      }

      // 2. Upsert user (create if doesn't exist)
      let user = await tx.user.findUnique({ where: { email } });
      if (!user) {
        user = await tx.user.create({ data: { name, email } });
      } else if (user.name !== name) {
        user = await tx.user.update({ where: { email }, data: { name } });
      }

      // 3. Create appointment
      return tx.appointment.create({
        data: {
          referenceId,
          userId: user.id,
          slotId,
          status: 'CONFIRMED'
        },
        include: { slot: true, user: true }
      });
    });

    return NextResponse.json({ 
      success: true, 
      appointment 
    });

  } catch (error: any) {
    console.error('Error booking appointment:', error);
    if (error.message === 'SLOT_TAKEN') {
      return NextResponse.json({ error: 'This slot has just been taken by someone else.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const referenceId = searchParams.get('referenceId');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        user: { email },
        ...(referenceId ? { referenceId } : {})
      },
      include: {
        slot: true,
        user: true
      },
      orderBy: {
        slot: { startTime: 'asc' }
      }
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}
