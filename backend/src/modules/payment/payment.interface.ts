export interface PaymentProvider {
  createPayment(amount: number, metadata?: any): Promise<any>;
  verifyPayment(transactionId: string): Promise<boolean>;
  refundPayment(transactionId: string): Promise<boolean>;
}
