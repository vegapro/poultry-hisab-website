import { describe, expect, it } from 'vitest';
import { trialFormSchema } from './schema';

const validApplication = {
  productionMode: 'BROILER' as const,
  owner: { name: 'Anil Kumar', phone: '9876543210' },
  farm: { name: 'Kumar Poultry Farm', location: 'Prayagraj', openingFeedStockKg: 5000, openingFeedStockRatePerKg: 35 },
  preferences: { feedStockLowThresholdKg: 800, mortalityAlertPercent: 4, paymentReminderDays: 7 },
  sheds: [{ startDate: '2026-09-25', birdCount: 4500 }],
  workers: [{ name: 'Ramesh', phone: '9876543211', language: 'hi' as const, sheds: ['Shed 1'], modules: ['FEED' as const] }],
};

describe('trialFormSchema', () => {
  it('rejects a non-positive bird count', () => {
    const invalid = structuredClone(validApplication);
    invalid.sheds[0].birdCount = 0;

    const result = trialFormSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ['sheds', 0, 'birdCount'],
        message: 'Birds placed must be greater than zero.',
      }));
    }
  });

  it('requires an explicit production mode', () => {
    const invalid = structuredClone(validApplication);
    delete (invalid as Partial<typeof invalid>).productionMode;

    const result = trialFormSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ['productionMode'],
      }));
    }
  });
});
