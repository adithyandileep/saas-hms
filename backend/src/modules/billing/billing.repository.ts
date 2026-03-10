import { BillingCategory } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class BillingRepository {
  getItemsByAppointmentId(appointmentId: string) { return prisma.billingItem.findMany({ where: { appointmentId }, orderBy: { createdAt: 'asc' } }); }
  getItemsByPatientId(patientId: string) {
    return prisma.appointment.findMany({
      where: { patientId },
      select: {
        id: true, token: true, startTime: true, status: true, paymentStatus: true, totalAmount: true, paidAmount: true, pendingAmount: true,
        billingItems: { orderBy: { createdAt: 'asc' } },
        invoice: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true, netAmount: true, issuedDate: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }
  createItem(data: { appointmentId: string; category: BillingCategory; itemId?: string; itemName: string; quantity: number; unitPrice: number; totalPrice: number }) { return prisma.billingItem.create({ data }); }
  updateItem(id: string, data: { itemName?: string; quantity?: number; unitPrice?: number; totalPrice?: number }) { return prisma.billingItem.update({ where: { id }, data }); }
  deleteItem(id: string) { return prisma.billingItem.delete({ where: { id } }); }
  getItemById(id: string) { return prisma.billingItem.findUnique({ where: { id } }); }
}
