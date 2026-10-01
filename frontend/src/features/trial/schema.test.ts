import { describe, expect, it } from 'vitest';
import { trialFormSchema } from './schema';

const validApplication = {
  owner: { name: 'Anil Kumar', phone: '9876543210' },
  farm: { name: 'Kumar Poultry Farm', location: 'Prayagraj', openingFeedStockKg: 5000, openingFeedStockRatePerKg: 35 },
  preferences: { feedStockLowThresholdKg: 800, mortalityAlertPercent: 4, paymentReminderDays: 7 },
  sheds: [{ name: 'Shed 1', capacity: 5000, batchName: 'September Batch', startDate: '2026-09-25', birdCount: 4500, maleCount: 4500, femaleCount: 0 }],
  workers: [{ name: 'Ramesh', phone: '9876543211', language: 'hi' as const, sheds: ['Shed 1'], modules: ['FEED' as const] }],
};

describe('trialFormSchema', () => {
  it('rejects a batch with more birds than its shed capacity', () => {
    const invalid = structuredClone(validApplication);
    invalid.sheds[0].capacity = 4_499;

    const result = trialFormSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ['sheds', 0, 'capacity'],
        message: 'Shed capacity cannot be lower than birds placed.',
      }));
    }
  });

  it('rejects a batch whose male and female counts do not equal birds placed', () => {
    const invalid = structuredClone(validApplication);
    invalid.sheds[0].maleCount = 3;
    invalid.sheds[0].femaleCount = 3;

    const result = trialFormSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ['sheds', 0, 'femaleCount'],
        message: 'Male and female counts must equal birds placed.',
      }));
    }
  });
});
