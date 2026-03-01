import { z } from 'zod';

export const CreateDoctorDto = z.object({
  name: z.string().min(1, 'Name is required'),
  departmentId: z.string().uuid('Invalid department ID pattern'),
  phone: z.string().max(10, 'Phone must be max 10 digits').regex(/^\d+$/, 'Must be numeric'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  consultationFee: z.number().max(10000, 'Fee cannot exceed 10000'),
  incrementIntervalDays: z.number().max(365, 'Interval cannot exceed 365 days'),
  renewalCharge: z.number().max(5000, 'Renewal charge cannot exceed 5000')
});

export const UpdateDoctorDto = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  departmentId: z.string().uuid('Invalid department ID pattern').optional(),
  phone: z.string().max(10, 'Phone must be max 10 digits').regex(/^\d+$/, 'Must be numeric').optional(),
  consultationFee: z.number().max(10000, 'Fee cannot exceed 10000').optional(),
  incrementIntervalDays: z.number().max(365, 'Interval cannot exceed 365 days').optional(),
  renewalCharge: z.number().max(5000, 'Renewal charge cannot exceed 5000').optional()
});
