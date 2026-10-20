import { z } from 'zod';
import { normalizeIndianPhone } from '../../lib/phone';

export const MODULE_OPTIONS = [
  { value: 'FEED', label: 'Feed' },
  { value: 'MORTALITY', label: 'Mortality' },
  { value: 'EGG_COLLECTION', label: 'Egg collection' },
  { value: 'WEIGHT_ENTRY', label: 'Weight' },
] as const;
export type ProductionMode = 'BROILER' | 'LAYER';
export const LAYER_PROFILES = [
  { id: '1bb29bc6-b466-42e8-99c1-dbd115316f44', label: 'Lohmann LSL Ultra Lite' },
  { id: '21dfea74-429c-4904-bb1f-75e1aeda7932', label: 'Venky BV300' },
  { id: '5ca34995-4c2f-499e-ab7f-6e60b4e2f872', label: 'Bovans White' },
] as const;
export function allowedEntryModulesForMode(mode: ProductionMode | undefined) {
  return mode === 'BROILER' ? MODULE_OPTIONS.filter((module) => module.value !== 'EGG_COLLECTION') : MODULE_OPTIONS;
}

const requiredName = (label: string) => z.string().trim().min(1, `${label} is required.`).max(100, 'Use 100 characters or fewer.');
const phone = z
  .string()
  .trim()
  .refine((value) => normalizeIndianPhone(value) !== null, 'Enter a valid Indian WhatsApp number.');
const nonNegative = z.number({ invalid_type_error: 'Enter a valid number.' }).finite('Enter a valid number.').min(0, 'Value cannot be negative.');

export const trialFormSchema = z
  .object({
    productionMode: z.preprocess((value) => value === '' ? undefined : value, z.enum(['BROILER', 'LAYER'], { required_error: 'Production type is required.' })),
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
          startDate: z.string().date('Use YYYY-MM-DD format.'),
          performanceProfileId: z.string().optional().refine((id) => !id || LAYER_PROFILES.some((profile) => profile.id === id), 'Select a supported Layer breed.'),
          birdCount: nonNegative.positive('Birds placed must be greater than zero.'),
          weeklyWeightDay: z.enum(['0', '1', '2', '3', '4', '5', '6']).optional(),
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
    value.sheds.forEach((shed, index) => {
      if (shed.performanceProfileId && value.productionMode !== 'LAYER') context.addIssue({ code: z.ZodIssueCode.custom, path: ['sheds', index, 'performanceProfileId'], message: 'Breed selection is available only for Layer farms.' });
    });
    const shedNames = new Set(value.sheds.map((_shed, index) => `shed ${index + 1}`));
    const workerPhones = new Set<string>();
    const ownerPhone = normalizeIndianPhone(value.owner.phone);

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
