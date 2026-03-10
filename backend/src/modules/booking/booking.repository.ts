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

  async findDoctorProfileByUserId(userId: string) {
    return prisma.doctorProfile.findFirst({
      where: { userId },
      select: { id: true },
    });
  }

  async getAppointmentsForDoctor(doctorId: string, patientId?: string) {
    return prisma.appointment.findMany({
      where: {
        doctorId,
        ...(patientId ? { patientId } : {}),
      },
      include: {
        patient: { select: { id: true, name: true, uhid: true, age: true, gender: true } },
        doctor: { select: { id: true, name: true, department: true } },
        visit: {
          select: {
            id: true,
            chiefComplaint: true,
            examination: true,
            diagnosis: true,
            diagnosisIcd10: true,
            treatmentPlan: true,
            consultationNotes: true,
            medications: true,
            labRequests: true,
            radiologyRequests: true,
            vitals: true,
            notes: true,
            status: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getAppointmentsForAdminOrReception(patientId?: string) {
    return prisma.appointment.findMany({
      where: patientId ? { patientId } : {},
      include: {
        patient: { select: { id: true, name: true, uhid: true, age: true, gender: true } },
        doctor: { select: { id: true, name: true, department: true } },
        visit: {
          select: {
            id: true,
            chiefComplaint: true,
            examination: true,
            diagnosis: true,
            diagnosisIcd10: true,
            treatmentPlan: true,
            consultationNotes: true,
            medications: true,
            labRequests: true,
            radiologyRequests: true,
            vitals: true,
            notes: true,
            status: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async acknowledgeAppointment(id: string) {
    return prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CHECKED_IN },
    });
  }

  async getAppointmentById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, uhid: true, age: true, gender: true, contactNo: true } },
        doctor: { select: { id: true, name: true, department: true } },
      },
    });
  }

  async getVisitByAppointmentId(appointmentId: string) {
    return prisma.visit.findUnique({ where: { appointmentId } });
  }

  async upsertVisitByAppointmentId(
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
      labRequests?: Prisma.InputJsonValue;
      radiologyRequests?: Prisma.InputJsonValue;
      vitals?: Prisma.InputJsonValue;
    }
  ) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const visitPayload = {
      chiefComplaint: data.chiefComplaint,
      examination: data.examination,
      diagnosis: data.diagnosis,
      diagnosisIcd10: data.diagnosisIcd10,
      treatmentPlan: data.treatmentPlan,
      consultationNotes: data.consultationNotes,
      notes: data.consultationNotes ?? data.notes,
      medications: data.medications,
      labRequests: data.labRequests,
      radiologyRequests: data.radiologyRequests,
      vitals: data.vitals,
    };

    return prisma.visit.upsert({
      where: { appointmentId },
      update: visitPayload,
      create: {
        appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        ...visitPayload,
      },
    });
  }

  async completeAppointment(id: string) {
    return prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.COMPLETED },
      });

      const visit = await tx.visit.findUnique({ where: { appointmentId: id } });
      if (visit) {
        await tx.visit.update({
          where: { appointmentId: id },
          data: { status: 'completed' },
        });
      }

      if (appointment.slotId) {
        const slot = await tx.slot.findUnique({ where: { id: appointment.slotId } });
        if (slot) {
          const newCount = Math.max(0, slot.bookedCount - 1);
          await tx.slot.update({
            where: { id: slot.id },
            data: {
              bookedCount: newCount,
              isAvailable: newCount < slot.maxCapacity,
            },
          });
        }
      }

      return appointment;
    });
  }

  async getActiveMedicines() {
    return prisma.medicine.findMany({
      where: { isActive: true },
      orderBy: [{ medicineName: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
