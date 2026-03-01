import { z } from 'zod';

export const RegisterPatientDto = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive('Age must be a positive integer'),
  dob: z.string().optional(),
  gender: z.string().optional(),
  contactNo: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianContact: z.string().optional(),
  registrationAmount: z.number().optional().default(200)
});
