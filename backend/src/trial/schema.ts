import { z } from 'zod';
import { ENTRY_MODULES, type TrialApplicationInput } from './types.js';

const PHONE_PATTERN = /^[6-9]\d{9}$/;

export function normalizeIndianPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const localNumber = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;

  if (!PHONE_PATTERN.test(localNumber)) {
    throw new Error('Enter a valid Indian WhatsApp number.');
  }

  return `+91${localNumber}`;
}

function phoneSchema() {
  return z
    .string()
    .trim()
    .refine((value) => {
      try {
        normalizeIndianPhone(value);
        return true;
      } catch {
        return false;
      }
    }, 'Enter a valid Indian WhatsApp number.')
    .transform(normalizeIndianPhone);
}

const nameSchema = z.string().trim().min(1, 'This field is required.').max(100, 'Use 100 characters or fewer.');
const nonNegativeNumber = z.number().finite('Enter a valid number.').min(0, 'Value cannot be negative.');
const positiveNumber = z.number().finite('Enter a valid number.').positive('Enter a value greater than zero.');

export const trialApplicationSchema: z.ZodType<TrialApplicationInput> = z
  .object({
    owner: z.object({ name: nameSchema, phone: phoneSchema() }).strict(),
    farm: z
      .object({
        name: nameSchema,
        location: z.string().trim().max(160, 'Use 160 characters or fewer.').optional(),
        openingFeedStockKg: nonNegativeNumber,
        openingFeedStockRatePerKg: nonNegativeNumber,
      })
      .strict(),
    preferences: z
      .object({
        feedStockLowThresholdKg: nonNegativeNumber,
        mortalityAlertPercent: nonNegativeNumber.max(100, 'Mortality percentage cannot exceed 100.'),
        paymentReminderDays: z.number().finite('Enter a valid number.').int('Enter a whole number.').min(0),
      })
      .strict(),
    sheds: z
      .array(
        z
          .object({
            name: nameSchema,
            capacity: nonNegativeNumber,
            batchName: nameSchema,
            startDate: z.string().date('Use YYYY-MM-DD format.'),
            birdCount: positiveNumber,
            maleCount: nonNegativeNumber,
            femaleCount: nonNegativeNumber,
          })
          .strict(),
      )
      .min(1, 'Add at least one shed.')
      .max(3, 'A trial supports up to three sheds.'),
    workers: z
      .array(
        z
          .object({
            name: nameSchema,
            phone: phoneSchema(),
            language: z.enum(['hinglish', 'hi']),
            sheds: z.array(nameSchema).min(1, 'Assign at least one shed.'),
            modules: z.array(z.enum(ENTRY_MODULES)).min(1, 'Select at least one module.'),
          })
          .strict(),
      )
      .min(1, 'Add at least one worker.')
      .max(4, 'A trial supports up to four workers.'),
  })
  .strict()
  .superRefine((value, context) => {
    const shedNames = new Set<string>();
    value.sheds.forEach((shed, index) => {
      if (shed.maleCount + shed.femaleCount > shed.birdCount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sheds', index, 'femaleCount'],
          message: 'Male and female counts cannot exceed birds placed.',
        });
      }
      if (shedNames.has(shed.name.toLowerCase())) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['sheds', index, 'name'], message: 'Shed names must be unique.' });
      }
      shedNames.add(shed.name.toLowerCase());
    });

    const workerPhones = new Set<string>();
    value.workers.forEach((worker, index) => {
      if (worker.phone === value.owner.phone) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['workers', index, 'phone'],
          message: 'Owner WhatsApp number must be different from worker numbers.',
        });
      }
      if (workerPhones.has(worker.phone)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['workers', index, 'phone'], message: 'Worker WhatsApp numbers must be unique.' });
      }
      workerPhones.add(worker.phone);

      worker.sheds.forEach((shedName, shedIndex) => {
        if (!shedNames.has(shedName.toLowerCase())) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['workers', index, 'sheds', shedIndex],
            message: 'Each assigned shed must be included in this application.',
          });
        }
      });
    });
  });
