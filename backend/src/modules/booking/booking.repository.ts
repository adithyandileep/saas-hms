import { prisma } from '../../config/prisma';
import { Prisma, AppointmentStatus, PaymentStatus } from '@prisma/client';

export class BookingRepository {
  async createSlot(data: Prisma.SlotUncheckedCreateInput) {
    return prisma.slot.create({ data });
  }

  async getAvailableSlots(doctorId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.slot.findMany({
      where: {
        doctorId,
        isAvailable: true,
        startTime: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  // Uses Optimistic Locking approach for race-condition prevention
  async bookSlotTransaction(
    patientId: string, 
    doctorId: string, 
    slotId: string, 
    expectedVersion: number,
    tokenStr: string,
    totalFee: number
  ) {
    return prisma.$transaction(async (tx: any) => {
      // 1. Try to update the slot atomically with version check
      const result = await tx.slot.updateMany({
        where: { id: slotId, version: expectedVersion, isAvailable: true },
        data: {
          bookedCount: { increment: 1 },
          version: { increment: 1 }
        }
      });

      if (result.count === 0) {
        throw new Error('Slot booking collision or slot unavailable. Please try again.');
      }

      // 2. Fetch the updated slot to check if it's now full
      const updatedSlot = await tx.slot.findUniqueOrThrow({ where: { id: slotId } });
      
      if (updatedSlot.bookedCount >= updatedSlot.maxCapacity) {
        await tx.slot.update({
          where: { id: slotId },
          data: { isAvailable: false }
        });
      }

      // 3. Create the Appointment
      const appointment = await tx.appointment.create({
        data: {
          token: tokenStr,
          patientId,
          doctorId,
          slotId,
          startTime: updatedSlot.startTime,
          endTime: updatedSlot.endTime,
          totalAmount: totalFee,
          pendingAmount: totalFee,
          status: AppointmentStatus.BOOKED,
          paymentStatus: PaymentStatus.PENDING
        }
      });

      return appointment;
    });
  }

  async getTodaysBookingsCount(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return prisma.appointment.count({
      where: {
        createdAt: { gte: startOfDay }
      }
    });
  }
}
