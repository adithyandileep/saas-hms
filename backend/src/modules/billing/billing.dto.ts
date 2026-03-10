import { z } from 'zod';

export const CreateBillingItemDto = z.object({
  appointmentId: z.string().uuid(),
  category: z.enum(['CONSULTATION', 'REGISTRATION', 'LAB_TEST', 'RADIOLOGY_TEST', 'OTHER']),
  itemId: z.string().optional(),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const UpdateBillingItemDto = z.object({
  itemName: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
});
