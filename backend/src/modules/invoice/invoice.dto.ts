import { InvoiceStatus } from '@prisma/client';
import { z } from 'zod';

export const GenerateInvoiceDto = z.object({
  taxRate: z.number().min(0).max(1).optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
});

export const UpdateInvoiceStatusDto = z.object({
  status: z.nativeEnum(InvoiceStatus),
});

