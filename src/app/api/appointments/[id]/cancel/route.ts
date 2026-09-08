import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const appointmentId = params.id;
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true, user: true }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.user.email !== email) {
      return NextResponse.json({ error: 'Unauthorized to cancel this appointment' }, { status: 403 });
    }

    if (appointment.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Appointment is already cancelled' }, { status: 400 });
    }

    // Cancellation rule: Check if it's at least 2 hours before the start time
    const now = new Date();
    const startTime = new Date(appointment.slot.startTime);
    const timeDifferenceMs = startTime.getTime() - now.getTime();
    const hoursDifference = timeDifferenceMs / (1000 * 60 * 60);

    if (hoursDifference < 2) {
      return NextResponse.json({ error: 'Appointments must be cancelled at least 2 hours in advance' }, { status: 400 });
    }

    // Cancel appointment and free up the slot
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' }
      }),
      prisma.slot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false }
      })
    ]);

    return NextResponse.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}
