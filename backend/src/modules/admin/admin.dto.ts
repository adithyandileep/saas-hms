import { z } from 'zod';

export const CreateAdminDto = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
  permissions: z.array(z.string()).default([]), // array of allowed module names
});

export const UpdateAdminDto = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
