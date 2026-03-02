import { z } from 'zod';

export const CreateMedicalReportDto = z.object({
  patientId: z.string().uuid(),
  reportType: z.string().min(2),
  description: z.string().optional(),
  fileUrl: z.string().url()
});

export type CreateMedicalReportType = z.infer<typeof CreateMedicalReportDto>;
