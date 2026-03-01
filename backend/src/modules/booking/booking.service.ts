import { BookingRepository } from './booking.repository';
import { CreateSlotDto, BookAppointmentDto } from './booking.dto';
import { z } from 'zod';
import { prisma } from '../../config/prisma';

export class BookingService {
  private repository = new BookingRepository();

  async createSlot(data: z.infer<typeof CreateSlotDto>) {
    return this.repository.createSlot({
      doctorId: data.doctorId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      maxCapacity: data.maxCapacity
    });
  }

  async getAvailableSlots(doctorId: string, dateString: string) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    return this.repository.getAvailableSlots(doctorId, date);
  }

  private async generateToken(): Promise<string> {
    const todaysCount = await this.repository.getTodaysBookingsCount();
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const sequential = (todaysCount + 1).toString().padStart(4, '0');
    return `TKN-${datePart}-${sequential}`;
  }

  async bookAppointment(data: z.infer<typeof BookAppointmentDto>) {
    // 1. Fetch Doctor to get Fee rules
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: data.doctorId },
      select: { consultationFee: true, incrementIntervalDays: true, renewalCharge: true }
    });
    if (!doctor) throw new Error("Doctor not found");

    // 2. Fetch Slot to check availability and get version
    const slot = await prisma.slot.findUnique({
      where: { id: data.slotId }
    });
    if (!slot || !slot.isAvailable) throw new Error("Slot unavailable");

    // 3. Dynamic Fee Calculation (Follow-up Logic)
    let finalFee = doctor.consultationFee;

    // Find the most recent completed or acknowledged appointment between this patient and doctor
    const lastAppointment = await prisma.appointment.findFirst({
      where: {
         patientId: data.patientId,
         doctorId: data.doctorId,
         status: { in: ['COMPLETED', 'ACKNOWLEDGED', 'CHECKED_IN'] }
      },
      orderBy: { startTime: 'desc' }
    });

    if (lastAppointment) {
       const daysSinceLastVisit = (new Date(slot.startTime).getTime() - new Date(lastAppointment.startTime).getTime()) / (1000 * 3600 * 24);
       
       if (daysSinceLastVisit <= doctor.incrementIntervalDays) {
          // Free follow-up within the interval
          finalFee = 0;
       } else {
          // Charged the renewal fee after the interval expires
          finalFee = doctor.renewalCharge;
       }
    }

    // 4. Generate sequential token
    const token = await this.generateToken();

    // 5. Execute atomic booking transaction with the calculated dynamic fee
    const appointment = await this.repository.bookSlotTransaction(
      data.patientId,
      data.doctorId,
      data.slotId,
      slot.version,
      token,
      finalFee
    );

    return appointment;
  }
}
