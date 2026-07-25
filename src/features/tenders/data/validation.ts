import { z } from 'zod';
import { TENDER_STATUSES } from '../data/tenders';

export const newTenderSchema = z.object({
  client: z.string().trim().min(1, 'Client is required').max(120),
  job: z.string().trim().min(1, 'Job description is required').max(240),
  received: z.string().min(1, 'Received date is required'),
  due: z.string().min(1, 'Due date is required'),
  contractSum: z
    .number({ error: 'Enter a number' })
    .finite()
    .min(0, 'Contract sum cannot be negative'),
  status: z.enum(TENDER_STATUSES),
});

export type NewTenderInput = z.infer<typeof newTenderSchema>;

export const newTenderFormSchema = newTenderSchema.extend({
  contractSum: z.string(), // raw form value, coerced at validation
});
