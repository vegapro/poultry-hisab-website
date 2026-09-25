import { z } from 'zod';
import { normalizeIndianPhone } from '../../lib/phone';

export const MODULE_OPTIONS = [
  { value: 'FEED', label: 'Feed' },
  { value: 'MORTALITY', label: 'Mortality' },
  { value: 'EGG_COLLECTION', label: 'Egg collection' },
  { value: 'WEIGHT_ENTRY', label: 'Weight' },
] as const;

const requiredName = (label: string) => z.string().trim().min(1, `${label} is required.`).max(100, 'Use 100 characters or fewer.');
const phone = z
  .string()
  .trim()
  .refine((value) => normalizeIndianPhone(value) !== null, 'Enter a valid Indian WhatsApp number.');
const nonNegative = z.number({ invalid_type_error: 'Enter a valid number.' }).finite('Enter a valid number.').min(0, 'Value cannot be negative.');

export const trialFormSchema = z
  .object({
    owner: z.object({ name: requiredName('Owner name'), phone }),
    farm: z.object({
      name: requiredName('Farm name'),
      location: z.string().trim().max(160, 'Use 160 characters or fewer.'),
      openingFeedStockKg: nonNegative,
      openingFeedStockRatePerKg: nonNegative,
    }),
    preferences: z.object({
      feedStockLowThresholdKg: nonNegative,
      mortalityAlertPercent: nonNegative.max(100, 'Mortality percentage cannot exceed 100.'),
      paymentReminderDays: z.number({ invalid_type_error: 'Enter a whole number.' }).int('Enter a whole number.').min(0),
    }),
    sheds: z
      .array(
        z.object({
          name: requiredName('Shed name'),
          capacity: nonNegative,
          batchName: requiredName('Batch name'),
          startDate: z.string().date('Use YYYY-MM-DD format.'),
          birdCount: nonNegative.positive('Birds placed must be greater than zero.'),
          maleCount: nonNegative,
          femaleCount: nonNegative,
        }),
      )
      .min(1, 'Add at least one shed.')
      .max(3, 'A trial supports up to three sheds.'),
    workers: z
      .array(
        z.object({
          name: requiredName('Worker name'),
          phone,
          language: z.enum(['hinglish', 'hi']),
          sheds: z.array(z.string()).min(1, 'Assign at least one shed.'),
          modules: z.array(z.enum(['FEED', 'MORTALITY', 'EGG_COLLECTION', 'WEIGHT_ENTRY'])).min(1, 'Select at least one module.'),
        }),
      )
      .min(1, 'Add at least one worker.')
      .max(4, 'A trial supports up to four workers.'),
  })
  .superRefine((value, context) => {
    const shedNames = new Set(value.sheds.map((shed) => shed.name.trim().toLowerCase()));
    const workerPhones = new Set<string>();
    const ownerPhone = normalizeIndianPhone(value.owner.phone);

    value.sheds.forEach((shed, index) => {
      if (shed.maleCount + shed.femaleCount > shed.birdCount) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['sheds', index, 'femaleCount'], message: 'Male and female counts cannot exceed birds placed.' });
      }
    });

    value.workers.forEach((worker, index) => {
      const workerPhone = normalizeIndianPhone(worker.phone);
      if (workerPhone && ownerPhone === workerPhone) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['workers', index, 'phone'], message: 'Owner WhatsApp number must be different from worker numbers.' });
      }
      if (workerPhone && workerPhones.has(workerPhone)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['workers', index, 'phone'], message: 'Worker WhatsApp numbers must be unique.' });
      }
      if (workerPhone) workerPhones.add(workerPhone);
      worker.sheds.forEach((shedName, shedIndex) => {
        if (!shedNames.has(shedName.trim().toLowerCase())) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: ['workers', index, 'sheds', shedIndex], message: 'Each assigned shed must be included in this application.' });
        }
      });
    });
  });
