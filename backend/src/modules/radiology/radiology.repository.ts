import { BillingCategory, RadiologyRequestStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class RadiologyRepository {
  getAllTests(includeInactive = false) { return prisma.radiologyTestCatalog.findMany({ where: includeInactive ? {} : { isActive: true }, orderBy: [{ testName: 'asc' }] }); }
  getTestById(id: string) { return prisma.radiologyTestCatalog.findUnique({ where: { id } }); }
  createTest(data: { testName: string; modality: string; price: number; description?: string }) { return prisma.radiologyTestCatalog.create({ data }); }
  updateTest(id: string, data: { testName?: string; modality?: string; price?: number; description?: string; isActive?: boolean }) { return prisma.radiologyTestCatalog.update({ where: { id }, data }); }
  getAllRequests(filters?: { status?: RadiologyRequestStatus; patientId?: string; doctorId?: string }) {
    return prisma.radiologyRequest.findMany({
      where: { ...(filters?.status ? { status: filters.status } : {}), ...(filters?.patientId ? { patientId: filters.patientId } : {}), ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}) },
      include: { radiologyTest: { select: { id: true, testName: true, modality: true } }, patient: { select: { id: true, name: true, uhid: true } }, doctor: { select: { id: true, name: true } }, report: true },
      orderBy: { orderedAt: 'desc' },
    });
  }
  getRequestById(id: string) {
    return prisma.radiologyRequest.findUnique({ where: { id }, include: { radiologyTest: true, patient: { select: { id: true, name: true, uhid: true, age: true, gender: true } }, doctor: { select: { id: true, name: true } }, report: true } });
  }
  getRequestsByPatientId(patientId: string) {
    return prisma.radiologyRequest.findMany({ where: { patientId }, include: { radiologyTest: { select: { id: true, testName: true, modality: true } }, doctor: { select: { id: true, name: true } }, report: true }, orderBy: { orderedAt: 'desc' } });
  }
  async createRequest(data: { visitId: string; appointmentId: string; patientId: string; doctorId: string; radiologyTestId: string; testNameSnapshot: string; modalitySnapshot: string; priceSnapshot: number; clinicalNotes?: string }) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.radiologyRequest.create({ data });
      await tx.billingItem.create({ data: { appointmentId: data.appointmentId, category: BillingCategory.RADIOLOGY_TEST, itemId: data.radiologyTestId, itemName: data.testNameSnapshot, quantity: 1, unitPrice: data.priceSnapshot, totalPrice: data.priceSnapshot } });
      await tx.appointment.update({ where: { id: data.appointmentId }, data: { totalAmount: { increment: data.priceSnapshot }, pendingAmount: { increment: data.priceSnapshot } } });
      return request;
    });
  }
  updateRequestStatus(id: string, status: RadiologyRequestStatus) { return prisma.radiologyRequest.update({ where: { id }, data: { status } }); }
  async createReport(data: { radiologyRequestId: string; fileUrl: string; uploadedBy: string; reportNotes?: string }) {
    return prisma.$transaction(async (tx) => {
      const report = await tx.radiologyReport.create({ data });
      await tx.radiologyRequest.update({ where: { id: data.radiologyRequestId }, data: { status: RadiologyRequestStatus.REPORT_UPLOADED } });
      return report;
    });
  }
  getReportById(id: string) {
    return prisma.radiologyReport.findUnique({ where: { id }, include: { radiologyRequest: { include: { patient: { select: { id: true, name: true, uhid: true } }, doctor: { select: { id: true, name: true } }, radiologyTest: { select: { id: true, testName: true, modality: true } } } } } });
  }
}
