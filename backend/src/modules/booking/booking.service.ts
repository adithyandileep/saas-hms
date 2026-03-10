import { PaymentMode, PaymentStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { InvoiceService } from '../invoice/invoice.service';
import { BookAppointmentDto, CreateSlotDto } from './booking.dto';
import { BookingRepository } from './booking.repository';

export class BookingService {
  private repository = new BookingRepository();

  async createSlot(data: z.infer<typeof CreateSlotDto>) {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    if (startTime < new Date()) throw new Error('Selected time is not valid or past.');
    const existingOverlaps = await this.repository.findOverlappingSlot(data.doctorId, startTime, endTime);
    if (existingOverlaps) throw new Error('Slot overlaps with an existing appointment slot.');
    return this.repository.createSlot({ doctorId: data.doctorId, startTime, endTime, maxCapacity: data.maxCapacity });
  }

  async createBulkSlots(data: z.infer<typeof import('./booking.dto').CreateBulkSlotsDto>) {
    const slots: Array<{ doctorId: string; startTime: Date; endTime: Date; maxCapacity: number }> = [];
    const [startHour, startMinute] = data.startTimeStr.split(':').map(Number);
    const [endHour, endMinute] = data.endTimeStr.split(':').map(Number);
    const now = new Date();
    const existingSlots = await this.repository.getFutureSlotsForDoctor(data.doctorId, now);

    const isOverlapping = (newStart: Date, newEnd: Date) =>
      existingSlots.some((existing) => newStart < existing.endTime && newEnd > existing.startTime);

    const generateForDate = (dateObj: Date) => {
      let currentSlotStart = new Date(dateObj);
      currentSlotStart.setHours(startHour, startMinute, 0, 0);
      const currentDayEnd = new Date(dateObj);
      currentDayEnd.setHours(endHour, endMinute, 0, 0);
      while (currentSlotStart < currentDayEnd) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + data.slotDurationMinutes * 60000);
        if (currentSlotEnd <= currentDayEnd) {
          if (currentSlotStart < now) throw new Error('Selected time is not valid or past.');
          if (isOverlapping(currentSlotStart, currentSlotEnd)) {
            throw new Error('One or more generated slots overlap with existing appointments for this doctor.');
          }
          slots.push({ doctorId: data.doctorId, startTime: new Date(currentSlotStart), endTime: new Date(currentSlotEnd), maxCapacity: data.maxCapacity });
        }
        currentSlotStart = new Date(currentSlotEnd.getTime() + data.breakDurationMinutes * 60000);
      }
    };

    if (data.specificDates?.length) {
      for (const dateStr of data.specificDates) generateForDate(new Date(dateStr));
    } else if (data.startDate && data.endDate) {
      let currentDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      endDate.setHours(23, 59, 59, 999);
      while (currentDate <= endDate) {
        if (!data.daysOfWeek || data.daysOfWeek.includes(currentDate.getDay())) generateForDate(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      throw new Error('Invalid date configuration for bulk slots.');
    }

    if (slots.length > 0) await this.repository.createBulkSlots(slots);
    return { count: slots.length, message: `Created ${slots.length} slots successfully.` };
  }

  async getAvailableSlots(doctorId: string, dateString: string) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return this.repository.getAvailableSlots(doctorId, date);
  }

  private async generateToken() {
    const todaysCount = await this.repository.getTodaysBookingsCount();
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `TKN-${datePart}-${String(todaysCount + 1).padStart(4, '0')}`;
  }

  async bookAppointment(data: z.infer<typeof BookAppointmentDto>) {
    const doctor = await this.repository.findDoctorFeeProfile(data.doctorId);
    if (!doctor) throw new Error('Doctor not found');
    const slot = await this.repository.findSlotById(data.slotId);
    if (!slot || !slot.isAvailable) throw new Error('Slot unavailable');
    let finalFee = doctor.consultationFee;
    const lastAppointment = await this.repository.findLastAppointmentForPatient(data.patientId, data.doctorId);
    if (lastAppointment) {
      const daysSinceLastVisit = (new Date(slot.startTime).getTime() - new Date(lastAppointment.startTime).getTime()) / (1000 * 3600 * 24);
      finalFee = daysSinceLastVisit <= doctor.incrementIntervalDays ? 0 : doctor.renewalCharge;
    }
    const token = await this.generateToken();
    return this.repository.bookSlotTransaction(data.patientId, data.doctorId, data.slotId, slot.version, token, finalFee);
  }

  async getAppointmentsForUser(userId: string, role: string, patientId?: string, doctorId?: string) {
    if (role === 'DOCTOR') {
      const profile = await this.repository.findDoctorProfileByUserId(userId);
      if (!profile) throw new Error('Doctor profile not found');
      return this.repository.getAppointmentsForDoctor(profile.id, patientId);
    }
    if (role === 'PATIENT') {
      const patient = await this.repository.findPatientByUserId(userId);
      if (!patient) throw new Error('Patient profile not found');
      return this.repository.getAppointmentsForPatient(patient.id);
    }
    if (doctorId) return this.repository.getAppointmentsForDoctor(doctorId, patientId);
    return this.repository.getAppointmentsForAdminOrReception(patientId);
  }

  async acknowledgeAppointment(id: string) {
    return this.repository.acknowledgeAppointment(id);
  }

  async getAppointmentById(id: string) {
    return this.repository.getAppointmentById(id);
  }

  async getVisit(appointmentId: string) {
    return this.repository.getVisitByAppointmentId(appointmentId);
  }

  async upsertVisit(
    appointmentId: string,
    data: {
      chiefComplaint?: string;
      examination?: string;
      diagnosis?: string;
      diagnosisIcd10?: string;
      treatmentPlan?: string;
      consultationNotes?: string;
      notes?: string;
      medications?: Prisma.InputJsonValue;
      labRequests?: Array<{ labTestId?: string; testName?: string; clinicalNotes?: string; status?: string }>;
      radiologyRequests?: Array<{ radiologyTestId?: string; modality?: string; testName?: string; clinicalNotes?: string; status?: string }>;
      vitals?: Prisma.InputJsonValue;
    },
  ) {
    return this.repository.upsertVisitByAppointmentId(appointmentId, data);
  }

  async completeAppointment(id: string) {
    return this.repository.completeAppointment(id);
  }

  async getActiveMedicines() {
    return this.repository.getActiveMedicines();
  }

  async payAppointment(appointmentId: string, amount: number, paymentMode: PaymentMode) {
    const appointment = await this.repository.getAppointmentPaymentSnapshot(appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    const { PaymentStrategyFactory } = require('../payment/payment.factory');
    const provider = PaymentStrategyFactory.getProvider(paymentMode);
    const paymentResult = await provider.createPayment(amount, { appointmentId });
    if (!paymentResult.success) throw new Error('Payment processing failed with provider');
    const newPaid = appointment.paidAmount + amount;
    const newPending = Math.max(0, appointment.totalAmount - newPaid);
    const newStatus = newPending === 0 ? PaymentStatus.PAID : newPaid > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PENDING;
    const updated = await this.repository.recordPaymentAndUpdateAppointment({
      appointmentId,
      amount,
      paymentMode,
      providerStatus: paymentResult.status,
      transactionId: paymentResult.transactionId,
      paidAmount: newPaid,
      pendingAmount: newPending,
      paymentStatus: newStatus,
    });
    try {
      const invoiceService = new InvoiceService();
      await invoiceService.syncStatusAfterPayment(appointmentId, newPaid, appointment.totalAmount);
    } catch {}
    return { data: updated, transactionInfo: paymentResult };
  }
}
