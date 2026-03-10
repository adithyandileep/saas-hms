import { BillingCategory } from '@prisma/client';
import { z } from 'zod';
import { CreateBillingItemDto, UpdateBillingItemDto } from './billing.dto';
import { BillingRepository } from './billing.repository';

export class BillingService {
  private repository = new BillingRepository();
  getItemsByAppointmentId(appointmentId: string) { return this.repository.getItemsByAppointmentId(appointmentId); }
  getItemsByPatientId(patientId: string) { return this.repository.getItemsByPatientId(patientId); }
  createItem(data: z.infer<typeof CreateBillingItemDto>) { return this.repository.createItem({ ...data, category: data.category as BillingCategory, totalPrice: data.quantity * data.unitPrice }); }
  async updateItem(id: string, data: z.infer<typeof UpdateBillingItemDto>) { const existing = await this.repository.getItemById(id); if (!existing) throw new Error('Billing item not found'); const quantity = data.quantity ?? existing.quantity; const unitPrice = data.unitPrice ?? existing.unitPrice; return this.repository.updateItem(id, { ...data, totalPrice: quantity * unitPrice }); }
  async deleteItem(id: string) { const existing = await this.repository.getItemById(id); if (!existing) throw new Error('Billing item not found'); return this.repository.deleteItem(id); }
}
