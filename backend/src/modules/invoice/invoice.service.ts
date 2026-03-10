import { InvoiceStatus } from '@prisma/client';
import { z } from 'zod';
import { GenerateInvoiceDto } from './invoice.dto';
import { InvoiceRepository } from './invoice.repository';

export class InvoiceService {
  private repository = new InvoiceRepository();

  getById(id: string) {
    return this.repository.getById(id);
  }

  getByAppointmentId(appointmentId: string) {
    return this.repository.getByAppointmentId(appointmentId);
  }

  getByPatientId(patientId: string) {
    return this.repository.getByPatientId(patientId);
  }

  private async generateInvoiceNumber() {
    const latest = await this.repository.getLatestInvoiceNumber();
    const nextNumber = latest?.invoiceNumber
      ? Number(latest.invoiceNumber.split('-').pop() || '0') + 1
      : 1;
    return `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(5, '0')}`;
  }

  async generateInvoice(appointmentId: string, payload: z.infer<typeof GenerateInvoiceDto>) {
    const appointment = await this.repository.getAppointmentInvoiceSource(appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    if (appointment.invoice) throw new Error('Invoice already exists for this appointment');
    if (appointment.billingItems.length === 0) throw new Error('No billing items available for invoice generation');

    const subtotal = appointment.billingItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = payload.taxRate ?? 0;
    const taxAmount = Number((subtotal * taxRate).toFixed(2));
    const netAmount = Number((subtotal + taxAmount).toFixed(2));
    const paidAmount = appointment.payments.reduce((sum, payment) => sum + payment.amount, 0);

    let status: InvoiceStatus = payload.status ?? InvoiceStatus.ISSUED;
    if (paidAmount >= netAmount && netAmount > 0) status = InvoiceStatus.PAID;
    else if (paidAmount > 0) status = InvoiceStatus.PARTIALLY_PAID;

    return this.repository.createInvoice({
      appointmentId,
      patientId: appointment.patientId,
      invoiceNumber: await this.generateInvoiceNumber(),
      totalAmount: subtotal,
      taxAmount,
      netAmount,
      status,
      billingItemIds: appointment.billingItems.map((item) => item.id),
    });
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    const invoice = await this.repository.getById(id);
    if (!invoice) throw new Error('Invoice not found');
    return this.repository.updateStatus(id, status);
  }

  async syncStatusAfterPayment(appointmentId: string, paidAmount: number, totalAmount: number) {
    const invoice = await this.repository.getByAppointmentId(appointmentId);
    if (!invoice) return null;

    const targetAmount = invoice.netAmount || totalAmount;
    let status: InvoiceStatus = InvoiceStatus.ISSUED;
    if (paidAmount >= targetAmount && targetAmount > 0) status = InvoiceStatus.PAID;
    else if (paidAmount > 0) status = InvoiceStatus.PARTIALLY_PAID;

    return this.repository.updateStatusByAppointmentId(appointmentId, status);
  }
}
