import { PaymentProvider } from './payment.interface';
import { CashPaymentService } from './strategies/cash-payment.service';
import { StripePaymentService } from './strategies/stripe-payment.service';
import { UpiPaymentService } from './strategies/upi-payment.service';

export class PaymentStrategyFactory {
  static getProvider(mode: 'CASH' | 'STRIPE' | 'UPI'): PaymentProvider {
    switch (mode) {
      case 'CASH':
        return new CashPaymentService();
      case 'STRIPE':
        return new StripePaymentService();
      case 'UPI':
        return new UpiPaymentService();
      default:
        throw new Error(`Unsupported payment mode: ${mode}`);
    }
  }
}
