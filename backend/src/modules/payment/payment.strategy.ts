export interface PaymentProvider {
  createPayment(amount: number, appointmentId: string): Promise<any>;
  verifyPayment(transactionId: string): Promise<boolean>;
  refundPayment(transactionId: string): Promise<any>;
}

export class StripePaymentService implements PaymentProvider {
  async createPayment(amount: number, appointmentId: string) {
    // Generate Stripe Checkout link / Intent
    return { transactionId: `STRIPE-TXN-${Date.now()}`, clientSecret: 'mock-secret', status: 'PENDING' };
  }

  async verifyPayment(transactionId: string) {
    // Check Stripe API
    return true;
  }

  async refundPayment(transactionId: string) {
    return { status: 'REFUNDED' };
  }
}

export class CashPaymentService implements PaymentProvider {
  async createPayment(amount: number, appointmentId: string) {
    // Direct cash collection by Receptionist
    return { transactionId: `CASH-TXN-${Date.now()}`, status: 'SUCCESS' };
  }

  async verifyPayment(transactionId: string) {
    // Cash is verified instantly
    return true;
  }

  async refundPayment(transactionId: string) {
    return { status: 'REFUNDED' };
  }
}

export class UpiPaymentService implements PaymentProvider {
  async createPayment(amount: number, appointmentId: string) {
    // Generate UPI QR Code logic
    return { transactionId: `UPI-TXN-${Date.now()}`, status: 'PENDING', qrCode: 'upi://pay?...' };
  }

  async verifyPayment(transactionId: string) {
    // Verify via webhook or poll
    return true;
  }

  async refundPayment(transactionId: string) {
    return { status: 'REFUNDED' };
  }
}
