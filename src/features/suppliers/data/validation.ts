import { z } from 'zod';
import { TRADES } from '../data/suppliers';

export const supplierSchema = z.object({
  company: z.string().trim().min(1, 'Company name is required').max(160),
  trade: z.enum(TRADES),
  contact: z.string().trim().min(1, 'Contact name is required').max(120),
  phone: z.string().trim().max(60).optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => v === '' || v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Enter a valid email address',
    ),
  note: z.string().trim().max(600).optional().or(z.literal('')),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
