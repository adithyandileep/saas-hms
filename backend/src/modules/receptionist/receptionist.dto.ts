import { z } from 'zod';

export const CreateReceptionistDto = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().max(10, 'Phone must be max 10 digits').regex(/^\d+$/, 'Must be numeric'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
