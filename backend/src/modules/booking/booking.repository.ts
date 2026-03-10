import { AppointmentStatus, BillingCategory, LabRequestStatus, PaymentMode, PaymentStatus, Prisma, RadiologyRequestStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class BookingRepository {
  async createSlot(data: Prisma.SlotUncheckedCreateInput) {
    return prisma.slot.create({ data });
  }

  async findOverlappingSlot(doctorId: string, startTime: Date, endTime: Date) {
    return prisma.slot.findFirst({ where: { doctorId, startTime: { lt: endTime }, endTime: { gt: startTime } } });
  }

  async getFutureSlotsForDoctor(doctorId: string, now: Date) {
    return prisma.slot.findMany({ where: { doctorId, endTime: { gt: now } }, select: { startTime: true, endTime: true } });
  }

  async createBulkSlots(data: Array<{ doctorId: string; startTime: Date; endTime: Date; maxCapacity: number }>) {
    return prisma.slot.createMany({ data, skipDuplicates: true });
  }

  async getAvailableSlots(doctorId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return prisma.slot.findMany({ where: { doctorId, isAvailable: true, startTime: { gte: startOfDay, lte: endOfDay } }, orderBy: { startTime: 'asc' } });
  }

  async bookSlotTransaction(patientId: string, doctorId: string, slotId: string, expectedVersion: number, tokenStr: string, totalFee: number) {
    return prisma.$transaction(async (tx: any) => {
      const result = await tx.slot.updateMany({ where: { id: slotId, version: expectedVersion, isAvailable: true }, data: { bookedCount: { increment: 1 }, version: { increment: 1 } } });
      if (result.count === 0) throw new Error('Slot booking collision or slot unavailable. Please try again.');
      const updatedSlot = await tx.slot.findUniqueOrThrow({ where: { id: slotId } });
      if (updatedSlot.bookedCount >= updatedSlot.maxCapacity) {
        await tx.slot.update({ where: { id: slotId }, data: { isAvailable: false } });
      }
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
          paymentStatus: PaymentStatus.PENDING,
        },
      });
      await tx.billingItem.create({
        data: {
          appointmentId: appointment.id,
          category: BillingCategory.CONSULTATION,
          itemId: doctorId,
          itemName: 'Consultation',
          quantity: 1,
          unitPrice: totalFee,
          totalPrice: totalFee,
        },
      });
      return appointment;
    });
  }

  async getTodaysBookingsCount() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return prisma.appointment.count({ where: { createdAt: { gte: startOfDay } } });
  }

  async findDoctorProfileByUserId(userId: string) {
    return prisma.doctorProfile.findFirst({ where: { userId }, select: { id: true } });
  }

  async findPatientByUserId(userId: string) {
    return prisma.patient.findFirst({ where: { userId }, select: { id: true } });
  }

  async findDoctorFeeProfile(doctorId: string) {
    return prisma.doctorProfile.findUnique({ where: { id: doctorId }, select: { consultationFee: true, incrementIntervalDays: true, renewalCharge: true } });
  }

  async findSlotById(slotId: string) {
    return prisma.slot.findUnique({ where: { id: slotId } });
  }

  async findLastAppointmentForPatient(patientId: string, doctorId: string) {
    return prisma.appointment.findFirst({ where: { patientId, doctorId, status: { in: ['COMPLETED', 'ACKNOWLEDGED', 'CHECKED_IN'] } }, orderBy: { startTime: 'desc' } });
  }

  async getAppointmentsForDoctor(doctorId: string, patientId?: string) {
    return prisma.appointment.findMany({
      where: { doctorId, ...(patientId ? { patientId } : {}) },
      include: {
        patient: { select: { id: true, name: true, uhid: true, age: true, gender: true } },
        doctor: { select: { id: true, name: true, department: true } },
        visit: { select: { id: true, chiefComplaint: true, examination: true, diagnosis: true, diagnosisIcd10: true, treatmentPlan: true, consultationNotes: true, notes: true, status: true } },
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
        visit: { select: { id: true, chiefComplaint: true, examination: true, diagnosis: true, diagnosisIcd10: true, treatmentPlan: true, consultationNotes: true, notes: true, status: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getAppointmentsForPatient(patientId: string) {
    return prisma.appointment.findMany({
      where: { patientId },
      include: {
        patient: { select: { id: true, name: true, uhid: true, age: true, gender: true } },
        doctor: { select: { id: true, name: true, department: true } },
        visit: { select: { id: true, chiefComplaint: true, examination: true, diagnosis: true, diagnosisIcd10: true, treatmentPlan: true, consultationNotes: true, notes: true, status: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async acknowledgeAppointment(id: string) {
    return prisma.appointment.update({ where: { id }, data: { status: AppointmentStatus.CHECKED_IN } });
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
    const visit = await prisma.visit.findUnique({
      where: { appointmentId },
      include: {
        vitalsRecord: true,
        labRequestRecords: { include: { labTest: { select: { id: true, testName: true, testCode: true } }, report: true }, orderBy: { orderedAt: 'asc' } },
        radiologyRequestRecords: { include: { radiologyTest: { select: { id: true, testName: true, modality: true } }, report: true }, orderBy: { orderedAt: 'asc' } },
      },
    });
    if (!visit) return null;
    return {
      ...visit,
      vitals: visit.vitalsRecord,
      labRequests: visit.labRequestRecords.map((request) => ({ id: request.id, labTestId: request.labTestId, testName: request.testNameSnapshot, clinicalNotes: request.clinicalNotes, status: request.status, report: request.report })),
      radiologyRequests: visit.radiologyRequestRecords.map((request) => ({ id: request.id, radiologyTestId: request.radiologyTestId, modality: request.modalitySnapshot, testName: request.testNameSnapshot, clinicalNotes: request.clinicalNotes, status: request.status, report: request.report })),
    };
  }

  async upsertVisitByAppointmentId(appointmentId: string, data: { chiefComplaint?: string; examination?: string; diagnosis?: string; diagnosisIcd10?: string; treatmentPlan?: string; consultationNotes?: string; notes?: string; medications?: Prisma.InputJsonValue; labRequests?: Array<{ labTestId?: string; testName?: string; clinicalNotes?: string; status?: string }>; radiologyRequests?: Array<{ radiologyTestId?: string; modality?: string; testName?: string; clinicalNotes?: string; status?: string }>; vitals?: Prisma.InputJsonValue; }) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw new Error('Appointment not found');
    await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.upsert({
        where: { appointmentId },
        update: { chiefComplaint: data.chiefComplaint, examination: data.examination, diagnosis: data.diagnosis, diagnosisIcd10: data.diagnosisIcd10, treatmentPlan: data.treatmentPlan, consultationNotes: data.consultationNotes, notes: data.notes ?? data.consultationNotes },
        create: { appointmentId, patientId: appointment.patientId, doctorId: appointment.doctorId, chiefComplaint: data.chiefComplaint, examination: data.examination, diagnosis: data.diagnosis, diagnosisIcd10: data.diagnosisIcd10, treatmentPlan: data.treatmentPlan, consultationNotes: data.consultationNotes, notes: data.notes ?? data.consultationNotes },
      });
      if (data.vitals) {
        const vitals = data.vitals as Record<string, unknown>;
        await tx.vitals.upsert({
          where: { visitId: visit.id },
          update: { temperature: String(vitals.temperature || ''), pulse: String(vitals.pulse || ''), spo2: String(vitals.spo2 || ''), bpSystolic: String(vitals.bpSystolic || ''), bpDiastolic: String(vitals.bpDiastolic || ''), respiratoryRate: String(vitals.respiratoryRate || ''), nurseNotes: String(vitals.nurseNotes || '') },
          create: { visitId: visit.id, temperature: String(vitals.temperature || ''), pulse: String(vitals.pulse || ''), spo2: String(vitals.spo2 || ''), bpSystolic: String(vitals.bpSystolic || ''), bpDiastolic: String(vitals.bpDiastolic || ''), respiratoryRate: String(vitals.respiratoryRate || ''), nurseNotes: String(vitals.nurseNotes || '') },
        });
      }
      const existingLabRequests = await tx.labRequest.findMany({ where: { visitId: visit.id }, select: { id: true, labTestId: true } });
      for (const request of data.labRequests ?? []) {
        const catalog = request.labTestId ? await tx.labTestCatalog.findUnique({ where: { id: request.labTestId } }) : request.testName ? await tx.labTestCatalog.findFirst({ where: { testName: request.testName, isActive: true } }) : null;
        if (!catalog) throw new Error(`Lab test not found for request "${request.testName || request.labTestId || 'unknown'}"`);
        const existing = existingLabRequests.find((item) => item.labTestId === catalog.id);
        if (existing) {
          await tx.labRequest.update({ where: { id: existing.id }, data: { clinicalNotes: request.clinicalNotes, status: (request.status as LabRequestStatus | undefined) ?? undefined } });
        } else {
          await tx.labRequest.create({ data: { visitId: visit.id, appointmentId, patientId: appointment.patientId, doctorId: appointment.doctorId, labTestId: catalog.id, testNameSnapshot: catalog.testName, priceSnapshot: catalog.price, clinicalNotes: request.clinicalNotes, status: (request.status as LabRequestStatus | undefined) ?? LabRequestStatus.REQUESTED } });
          await tx.billingItem.create({ data: { appointmentId, category: BillingCategory.LAB_TEST, itemId: catalog.id, itemName: catalog.testName, quantity: 1, unitPrice: catalog.price, totalPrice: catalog.price } });
          await tx.appointment.update({ where: { id: appointmentId }, data: { totalAmount: { increment: catalog.price }, pendingAmount: { increment: catalog.price } } });
        }
      }
      const existingRadiologyRequests = await tx.radiologyRequest.findMany({ where: { visitId: visit.id }, select: { id: true, radiologyTestId: true } });
      for (const request of data.radiologyRequests ?? []) {
        const catalog = request.radiologyTestId ? await tx.radiologyTestCatalog.findUnique({ where: { id: request.radiologyTestId } }) : request.testName ? await tx.radiologyTestCatalog.findFirst({ where: { testName: request.testName, isActive: true } }) : null;
        if (!catalog) throw new Error(`Radiology test not found for request "${request.testName || request.radiologyTestId || 'unknown'}"`);
        const existing = existingRadiologyRequests.find((item) => item.radiologyTestId === catalog.id);
        if (existing) {
          await tx.radiologyRequest.update({ where: { id: existing.id }, data: { clinicalNotes: request.clinicalNotes, status: (request.status as RadiologyRequestStatus | undefined) ?? undefined } });
        } else {
          await tx.radiologyRequest.create({ data: { visitId: visit.id, appointmentId, patientId: appointment.patientId, doctorId: appointment.doctorId, radiologyTestId: catalog.id, testNameSnapshot: catalog.testName, modalitySnapshot: catalog.modality, priceSnapshot: catalog.price, clinicalNotes: request.clinicalNotes, status: (request.status as RadiologyRequestStatus | undefined) ?? RadiologyRequestStatus.REQUESTED } });
          await tx.billingItem.create({ data: { appointmentId, category: BillingCategory.RADIOLOGY_TEST, itemId: catalog.id, itemName: catalog.testName, quantity: 1, unitPrice: catalog.price, totalPrice: catalog.price } });
          await tx.appointment.update({ where: { id: appointmentId }, data: { totalAmount: { increment: catalog.price }, pendingAmount: { increment: catalog.price } } });
        }
      }
    });
    return this.getVisitByAppointmentId(appointmentId);
  }

  async completeAppointment(id: string) {
    return prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({ where: { id }, data: { status: AppointmentStatus.COMPLETED } });
      await tx.visit.updateMany({ where: { appointmentId: id }, data: { status: 'completed' } });
      return appointment;
    });
  }

  async getActiveMedicines() {
    return prisma.medicine.findMany({ where: { isActive: true }, orderBy: [{ medicineName: 'asc' }, { createdAt: 'desc' }] });
  }

  async getAppointmentPaymentSnapshot(id: string) {
    return prisma.appointment.findUnique({ where: { id }, select: { id: true, paidAmount: true, totalAmount: true } });
  }

  async recordPaymentAndUpdateAppointment(data: { appointmentId: string; amount: number; paymentMode: PaymentMode; providerStatus: string; transactionId?: string; paidAmount: number; pendingAmount: number; paymentStatus: PaymentStatus }) {
    return prisma.$transaction(async (tx) => {
      await tx.payment.create({ data: { appointmentId: data.appointmentId, amount: data.amount, paymentMode: data.paymentMode, status: data.providerStatus, transactionId: data.transactionId } });
      return tx.appointment.update({ where: { id: data.appointmentId }, data: { paidAmount: data.paidAmount, pendingAmount: data.pendingAmount, paymentStatus: data.paymentStatus } });
    });
  }
}
