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

  async createBulkSlots(data: z.infer<typeof import('./booking.dto').CreateBulkSlotsDto>) {
    const slots: any[] = [];

    const [startHour, startMinute] = data.startTimeStr.split(':').map(Number);
    const [endHour, endMinute] = data.endTimeStr.split(':').map(Number);

    const generateForDate = (dateObj: Date) => {
      let currentSlotStart = new Date(dateObj);
      currentSlotStart.setHours(startHour, startMinute, 0, 0);

      const currentDayEnd = new Date(dateObj);
      currentDayEnd.setHours(endHour, endMinute, 0, 0);

      while (currentSlotStart < currentDayEnd) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + data.slotDurationMinutes * 60000);

        if (currentSlotEnd <= currentDayEnd) {
          slots.push({
            doctorId: data.doctorId,
            startTime: new Date(currentSlotStart),
            endTime: new Date(currentSlotEnd),
            maxCapacity: data.maxCapacity
          });
        }

        currentSlotStart = new Date(currentSlotEnd.getTime() + data.breakDurationMinutes * 60000);
      }
    };

    if (data.specificDates && data.specificDates.length > 0) {
      for (const dateStr of data.specificDates) {
        generateForDate(new Date(dateStr));
      }
    } else if (data.startDate && data.endDate) {
      let currentDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      endDate.setHours(23, 59, 59, 999);

      while (currentDate <= endDate) {
        if (!data.daysOfWeek || data.daysOfWeek.includes(currentDate.getDay())) {
          generateForDate(currentDate);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      throw new Error("Invalid date configuration for bulk slots.");
    }

    if (slots.length > 0) {
      await prisma.slot.createMany({ data: slots, skipDuplicates: true });
    }

    return { count: slots.length, message: `Created ${slots.length} slots successfully.` };
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
