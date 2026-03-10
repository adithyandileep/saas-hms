import { BillingCategory, LabRequestStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class LabRepository {
  getAllTests(includeInactive = false) {
    return prisma.labTestCatalog.findMany({ where: includeInactive ? {} : { isActive: true }, orderBy: [{ testName: 'asc' }] });
  }
  getTestById(id: string) { return prisma.labTestCatalog.findUnique({ where: { id } }); }
  createTest(data: { testName: string; testCode: string; price: number; description?: string; department?: string }) { return prisma.labTestCatalog.create({ data }); }
  updateTest(id: string, data: { testName?: string; testCode?: string; price?: number; description?: string; department?: string; isActive?: boolean }) { return prisma.labTestCatalog.update({ where: { id }, data }); }
  getAllRequests(filters?: { status?: LabRequestStatus; patientId?: string; doctorId?: string }) {
    return prisma.labRequest.findMany({
      where: { ...(filters?.status ? { status: filters.status } : {}), ...(filters?.patientId ? { patientId: filters.patientId } : {}), ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}) },
      include: { labTest: { select: { id: true, testName: true, testCode: true, department: true } }, patient: { select: { id: true, name: true, uhid: true } }, doctor: { select: { id: true, name: true } }, report: true },
      orderBy: { orderedAt: 'desc' },
    });
  }
  getRequestById(id: string) {
    return prisma.labRequest.findUnique({ where: { id }, include: { labTest: true, patient: { select: { id: true, name: true, uhid: true, age: true, gender: true } }, doctor: { select: { id: true, name: true } }, report: true } });
  }
  getRequestsByPatientId(patientId: string) {
    return prisma.labRequest.findMany({ where: { patientId }, include: { labTest: { select: { id: true, testName: true, testCode: true } }, doctor: { select: { id: true, name: true } }, report: true }, orderBy: { orderedAt: 'desc' } });
  }
  async createRequest(data: { visitId: string; appointmentId: string; patientId: string; doctorId: string; labTestId: string; testNameSnapshot: string; priceSnapshot: number; clinicalNotes?: string }) {
    return prisma.$transaction(async (tx) => {
      const labRequest = await tx.labRequest.create({ data });
      await tx.billingItem.create({ data: { appointmentId: data.appointmentId, category: BillingCategory.LAB_TEST, itemId: data.labTestId, itemName: data.testNameSnapshot, quantity: 1, unitPrice: data.priceSnapshot, totalPrice: data.priceSnapshot } });
      await tx.appointment.update({ where: { id: data.appointmentId }, data: { totalAmount: { increment: data.priceSnapshot }, pendingAmount: { increment: data.priceSnapshot } } });
      return labRequest;
    });
  }
  updateRequestStatus(id: string, status: LabRequestStatus) { return prisma.labRequest.update({ where: { id }, data: { status } }); }
  async createReport(data: { labRequestId: string; fileUrl: string; uploadedBy: string; reportNotes?: string }) {
    return prisma.$transaction(async (tx) => {
      const report = await tx.labReport.create({ data });
      await tx.labRequest.update({ where: { id: data.labRequestId }, data: { status: LabRequestStatus.REPORT_UPLOADED } });
      return report;
    });
  }
  getReportById(id: string) {
    return prisma.labReport.findUnique({ where: { id }, include: { labRequest: { include: { patient: { select: { id: true, name: true, uhid: true } }, doctor: { select: { id: true, name: true } }, labTest: { select: { id: true, testName: true, testCode: true } } } } } });
  }
}
