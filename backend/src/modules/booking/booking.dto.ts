import { z } from 'zod';

export const CreateSlotDto = z.object({
  doctorId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  maxCapacity: z.number().int().positive().default(1)
});

export const BookAppointmentDto = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  slotId: z.string().uuid(),
  paymentMode: z.enum(['CASH', 'CREDIT', 'UPI', 'STRIPE'])
});
