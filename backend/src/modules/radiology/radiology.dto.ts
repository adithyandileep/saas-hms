import { z } from 'zod';

export const CreateRadiologyTestDto = z.object({
  testName: z.string().min(1),
  modality: z.enum(['X_RAY', 'MRI', 'CT_SCAN', 'ULTRASOUND']),
  price: z.number().positive(),
  description: z.string().optional(),
});

export const UpdateRadiologyTestDto = z.object({
  testName: z.string().min(1).optional(),
  modality: z.enum(['X_RAY', 'MRI', 'CT_SCAN', 'ULTRASOUND']).optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const CreateRadiologyRequestDto = z.object({
  visitId: z.string().uuid(),
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  radiologyTestId: z.string().uuid(),
  clinicalNotes: z.string().optional(),
});

export const UpdateRadiologyRequestStatusDto = z.object({
  status: z.enum(['REQUESTED', 'SCHEDULED', 'REPORT_UPLOADED', 'COMPLETED']),
});

export const CreateRadiologyReportDto = z.object({
  radiologyRequestId: z.string().uuid(),
  fileUrl: z.string().url(),
  uploadedBy: z.string().min(1),
  reportNotes: z.string().optional(),
});
