import { PaymentProvider } from '../payment.interface';

export class CashPaymentService implements PaymentProvider {
  async createPayment(amount: number, metadata?: any): Promise<any> {
    // In cash operations, payment is immediately recorded at reception
    return {
      success: true,
      transactionId: `CASH-${Date.now()}`,
      amount,
      status: 'SUCCESS',
      message: 'Cash payment recorded'
    };
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    // Cash is verified instantly by the receptionist
    return true;
  }

  async refundPayment(transactionId: string): Promise<boolean> {
    // Cash refunds are manual processes
    return true;
  }
}
