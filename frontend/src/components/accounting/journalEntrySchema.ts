import { z } from 'zod';

export const journalEntryLineSchema = z.object({
  accountId: z.coerce.number().min(1, "الرجاء اختيار حساب"),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
  costCenterId: z.coerce.number().optional(),
}).refine(data => data.debit > 0 || data.credit > 0, {
  message: "يجب إدخال مبلغ مدين أو دائن",
  path: ["debit"]
}).refine(data => !(data.debit > 0 && data.credit > 0), {
  message: "لا يمكن إدخال مبلغ مدين ودائن في نفس السطر",
  path: ["debit"]
});

export const journalEntrySchema = z.object({
  date: z.string().min(1, "تاريخ القيد مطلوب"),
  description: z.string().min(1, "البيان مطلوب"),
  reference: z.string().optional(),
  status: z.enum(['posted', 'draft']),
  lines: z.array(journalEntryLineSchema).min(2, "يجب إضافة سطرين على الأقل"),
});

export type JournalEntryFormData = z.infer<typeof journalEntrySchema>;
