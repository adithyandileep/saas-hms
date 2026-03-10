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
  examination: z.string().optional(),
  diagnosis: z.string().optional(),
  diagnosisIcd10: z.string().optional(),
  treatmentPlan: z.string().optional(),
  consultationNotes: z.string().optional(),
  notes: z.string().optional(),
  medications: z.array(z.object({
    medicineId: z.string().uuid(),
    brand: z.string().min(1),
    drug: z.string().min(1),
    strength: z.string().min(1),
    dosageForm: z.string().min(1),
    dose: z.string().min(1),
    unit: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    durationUnit: z.string().min(1),
    instructions: z.string().min(1),
    notes: z.string().optional(),
  })).optional(),
  labRequests: z.array(z.object({
    testName: z.string().min(1),
    clinicalNotes: z.string().optional(),
    status: z.string().default('REQUESTED'),
  })).optional(),
  radiologyRequests: z.array(z.object({
    modality: z.enum(['X_RAY', 'MRI', 'CT_SCAN', 'ULTRASOUND']),
    testName: z.string().min(1),
    clinicalNotes: z.string().optional(),
    status: z.string().default('REQUESTED'),
  })).optional(),
  vitals: z.object({
    temperature: z.string().optional(),
    pulse: z.string().optional(),
    spo2: z.string().optional(),
    bpSystolic: z.string().optional(),
    bpDiastolic: z.string().optional(),
    respiratoryRate: z.string().optional(),
    nurseNotes: z.string().optional(),
  }).optional(),
});

export const CompleteAppointmentDto = z.object({
  sendEmail: z.boolean().optional().default(false)
});
