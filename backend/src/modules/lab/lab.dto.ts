import { z } from 'zod';

export const CreateLabTestDto = z.object({
  testName: z.string().min(1),
  testCode: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  department: z.string().optional(),
});

export const UpdateLabTestDto = z.object({
  testName: z.string().min(1).optional(),
  testCode: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const CreateLabRequestDto = z.object({
  visitId: z.string().uuid(),
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  labTestId: z.string().uuid(),
  clinicalNotes: z.string().optional(),
});

export const UpdateLabRequestStatusDto = z.object({
  status: z.enum(['REQUESTED', 'SAMPLE_COLLECTED', 'REPORT_UPLOADED', 'COMPLETED']),
});

export const CreateLabReportDto = z.object({
  labRequestId: z.string().uuid(),
  fileUrl: z.string().url(),
  uploadedBy: z.string().min(1),
  reportNotes: z.string().optional(),
});
