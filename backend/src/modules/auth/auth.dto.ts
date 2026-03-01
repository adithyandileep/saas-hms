import { z } from 'zod';

export const LoginDto = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const SetupDto = z.object({
  organizationName: z.string().min(1, 'Organization Name is required'),
  superAdminUsername: z.string().min(3, 'Username must be at least 3 characters'),
  superAdminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  timezone: z.string(),
  currency: z.string(),
  logoUrl: z.string().optional()
});
