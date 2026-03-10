import { InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class InvoiceRepository {
  getById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            patient: { select: { id: true, name: true, uhid: true } },
            doctor: { select: { id: true, name: true } },
          },
        },
        patient: { select: { id: true, name: true, uhid: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  getByAppointmentId(appointmentId: string) {
    return prisma.invoice.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            patient: { select: { id: true, name: true, uhid: true } },
            doctor: { select: { id: true, name: true } },
            payments: { orderBy: { paymentDate: 'asc' } },
          },
        },
        patient: { select: { id: true, name: true, uhid: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  getByPatientId(patientId: string) {
    return prisma.invoice.findMany({
      where: { patientId },
      include: {
        appointment: {
          select: {
            id: true,
            token: true,
            startTime: true,
            status: true,
            paymentStatus: true,
            paidAmount: true,
            pendingAmount: true,
          },
        },
        items: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { issuedDate: 'desc' },
    });
  }

  getAppointmentInvoiceSource(appointmentId: string) {
    return prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, uhid: true } },
        doctor: { select: { id: true, name: true } },
        billingItems: { where: { invoiceId: null }, orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { paymentDate: 'asc' } },
        invoice: true,
      },
    });
  }

  async createInvoice(data: {
    appointmentId: string;
    patientId: string;
    invoiceNumber: string;
    totalAmount: number;
    taxAmount: number;
    netAmount: number;
    status: InvoiceStatus;
    billingItemIds: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          invoiceNumber: data.invoiceNumber,
          totalAmount: data.totalAmount,
          taxAmount: data.taxAmount,
          netAmount: data.netAmount,
          status: data.status,
        },
      });

      if (data.billingItemIds.length > 0) {
        await tx.billingItem.updateMany({
          where: { id: { in: data.billingItemIds } },
          data: { invoiceId: invoice.id },
        });
      }

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          appointment: {
            include: {
              patient: { select: { id: true, name: true, uhid: true } },
              doctor: { select: { id: true, name: true } },
              payments: { orderBy: { paymentDate: 'asc' } },
            },
          },
          patient: { select: { id: true, name: true, uhid: true } },
          items: { orderBy: { createdAt: 'asc' } },
        },
      });
    });
  }

  updateStatus(id: string, status: InvoiceStatus) {
    return prisma.invoice.update({ where: { id }, data: { status } });
  }

  updateStatusByAppointmentId(appointmentId: string, status: InvoiceStatus) {
    return prisma.invoice.update({ where: { appointmentId }, data: { status } });
  }

  getLatestInvoiceNumber() {
    return prisma.invoice.findFirst({
      orderBy: { issuedDate: 'desc' },
      select: { invoiceNumber: true },
    });
  }
}

