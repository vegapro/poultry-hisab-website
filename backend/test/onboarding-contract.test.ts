import { describe, expect, it } from 'vitest';
import { buildOnboardingPayload } from '../src/trial/payload.js';
import { trialApplicationSchema } from '../src/trial/schema.js';

const validApplication = {
  owner: { name: 'Anil Kumar', phone: '9876543210' },
  farm: {
    name: 'Kumar Poultry Farm',
    location: 'Prayagraj, Uttar Pradesh',
    openingFeedStockKg: 5000,
    openingFeedStockRatePerKg: 35,
  },
  preferences: {
    feedStockLowThresholdKg: 800,
    mortalityAlertPercent: 4,
    paymentReminderDays: 7,
  },
  sheds: [{
    name: 'Shed 1',
    capacity: 5000,
    batchName: 'September Batch',
    startDate: '2026-09-25',
    birdCount: 4500,
    maleCount: 4500,
    femaleCount: 0,
  }],
  workers: [{
    name: 'Ramesh',
    phone: '9876543211',
    language: 'hi' as const,
    sheds: ['Shed 1'],
    modules: ['FEED', 'MORTALITY'],
  }],
};

describe('onboarding payload contract', () => {
  it('serializes into an input accepted by the root onboarding script', () => {
    const parsed = JSON.parse(JSON.stringify(buildOnboardingPayload(trialApplicationSchema.parse(validApplication))));

    expect(parsed.config.whatsappDeliveryMode).toBe('LIVE');
    expect(parsed.sheds[0].batch.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parsed.owners[0].role).toBe('FARM_OWNER');
    expect(parsed.workers[0].language).toMatch(/^(hinglish|hi)$/);
    expect(parsed.workers[0].sheds).toEqual(['Shed 1']);
    expect(parsed).not.toHaveProperty('id');
    expect(parsed).not.toHaveProperty('status');
  });

  it('rejects a batch with more birds than its shed capacity', () => {
    const invalid = structuredClone(validApplication);
    invalid.sheds[0].capacity = 4_499;

    const result = trialApplicationSchema.safeParse(invalid);

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

    const result = trialApplicationSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ['sheds', 0, 'femaleCount'],
        message: 'Male and female counts must equal birds placed.',
      }));
    }
  });
});
