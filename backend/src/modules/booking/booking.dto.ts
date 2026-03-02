import { z } from 'zod';

export const CreateSlotDto = z.object({
  doctorId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  maxCapacity: z.number().int().positive().default(1)
});

export const CreateBulkSlotsDto = z.object({
  doctorId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  startTimeStr: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Format HH:mm'),
  endTimeStr: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Format HH:mm'),
  slotDurationMinutes: z.number().int().positive().default(15),
  breakDurationMinutes: z.number().int().min(0).default(0),
  maxCapacity: z.number().int().positive().default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
  specificDates: z.array(z.string().datetime()).optional()
}).refine(data => (data.startDate && data.endDate) || (data.specificDates && data.specificDates.length > 0), {
  message: "Either startDate and endDate OR specificDates must be provided"
});

export const BookAppointmentDto = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  slotId: z.string().uuid(),
  paymentMode: z.enum(['CASH', 'CREDIT', 'UPI', 'STRIPE'])
});

export const UpdateVisitDto = z.object({
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  medications: z.any().optional(), // Could be more strictly typed based on JSON structure
});

export const CompleteAppointmentDto = z.object({
  sendEmail: z.boolean().optional().default(false)
});
