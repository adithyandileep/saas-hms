import { PaymentProvider, StripePaymentService, CashPaymentService, UpiPaymentService } from './payment.strategy';
import { PaymentMode, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class PaymentContext {
  private provider: PaymentProvider;

  constructor(mode: PaymentMode) {
    switch (mode) {
      case PaymentMode.STRIPE:
      case PaymentMode.CREDIT: // mapping credit generic to stripe logic 
        this.provider = new StripePaymentService();
        break;
      case PaymentMode.CASH:
        this.provider = new CashPaymentService();
        break;
      case PaymentMode.UPI:
        this.provider = new UpiPaymentService();
        break;
      default:
        throw new Error('Unsupported payment mode');
    }
  }

  async processPayment(appointmentId: string, amount: number, mode: PaymentMode) {
    // Using OOP composition strategy
    const result = await this.provider.createPayment(amount, appointmentId);
    
    // Create payment record in DB
    const dbPayment = await prisma.payment.create({
      data: {
        appointmentId,
        amount,
        paymentMode: mode,
        transactionId: result.transactionId,
        status: result.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING'
      }
    });

    if (result.status === 'SUCCESS') {
      // It's immediate like cash, update appointment status
      const appointment = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId }});
      const newPaid = appointment.paidAmount + amount;
      const newPending = appointment.totalAmount - newPaid;
      
      let pStatus: PaymentStatus = PaymentStatus.PENDING;
      if (newPending <= 0) pStatus = PaymentStatus.PAID;
      else if (newPaid > 0) pStatus = PaymentStatus.PARTIAL;

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { paidAmount: newPaid, pendingAmount: newPending, paymentStatus: pStatus }
      });
    }

    return { dbPayment, gatewayResponse: result };
  }
}
