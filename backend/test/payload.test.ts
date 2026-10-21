import { describe, expect, it } from 'vitest';
import { buildOnboardingPayload } from '../src/trial/payload.js';
import { normalizeIndianPhone, trialApplicationSchema } from '../src/trial/schema.js';

const validApplication = {
  productionMode: 'BROILER' as const,
  owner: { name: 'Anil Kumar', phone: '+91 98765 43210' },
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
  sheds: [
    {
      startDate: '2026-09-25',
      birdCount: 4500,
    },
  ],
  workers: [
    {
      name: 'Ramesh',
      phone: '919876543211',
      language: 'hi' as const,
      sheds: ['Shed 1'],
      modules: ['FEED', 'MORTALITY'] as const,
    },
  ],
};

describe('trial application schema', () => {
  it('normalizes supported Indian phone formats', () => {
    expect(normalizeIndianPhone('+91 98765 43210')).toBe('+919876543210');
    expect(normalizeIndianPhone('919876543210')).toBe('+919876543210');
    expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
  });

  it('rejects when the owner is also a worker', () => {
    const invalid = structuredClone(validApplication);
    invalid.workers[0].phone = '9876543210';

    expect(() => trialApplicationSchema.parse(invalid)).toThrow('Owner WhatsApp number must be different');
  });

  it('rejects workers assigned to a shed not submitted in the request', () => {
    const invalid = structuredClone(validApplication);
    invalid.workers[0].sheds = ['Unknown Shed'];

    expect(() => trialApplicationSchema.parse(invalid)).toThrow('assigned shed');
  });

  it('rejects client-supplied sex counts because placements are mode-derived', () => {
    const invalid = { ...validApplication, sheds: [{ ...validApplication.sheds[0], maleCount: 4400 }] };

    expect(() => trialApplicationSchema.parse(invalid)).toThrow('Unrecognized key');
  });

  it('rejects egg collection for a broiler trial', () => {
    const invalid = structuredClone(validApplication);
    invalid.workers[0].modules = ['FEED', 'EGG_COLLECTION'] as any;

    expect(() => trialApplicationSchema.parse(invalid)).toThrow('Egg collection is available only for layer trials');
  });

  it('accepts more than three sheds', () => {
    const application = structuredClone(validApplication);
    application.sheds = Array.from({ length: 4 }, () => ({
      startDate: '2026-09-25',
      birdCount: 4500,
    }));

    expect(trialApplicationSchema.safeParse(application).success).toBe(true);
  });
});

describe('buildOnboardingPayload', () => {
  it('preserves different supported profile IDs per Layer shed and omits an empty selection', () => {
    const input = { ...validApplication, productionMode: 'LAYER', sheds: [
      { ...validApplication.sheds[0], performanceProfileId: '1bb29bc6-b466-42e8-99c1-dbd115316f44' },
      { ...validApplication.sheds[0], performanceProfileId: '21dfea74-429c-4904-bb1f-75e1aeda7932' },
      { ...validApplication.sheds[0], performanceProfileId: '' },
    ] };
    const payload = buildOnboardingPayload(trialApplicationSchema.parse(input));
    expect(payload.sheds.map((shed) => shed.batch.performanceProfileId)).toEqual(['1bb29bc6-b466-42e8-99c1-dbd115316f44', '21dfea74-429c-4904-bb1f-75e1aeda7932', undefined]);
    expect(payload.sheds[2].batch).not.toHaveProperty('performanceProfileId');
  });

  it('rejects unsupported IDs and Broiler profile selections', () => {
    const input = { ...validApplication, sheds: [{ ...validApplication.sheds[0], performanceProfileId: '5ca34995-4c2f-499e-ab7f-6e60b4e2f872' }] };
    expect(trialApplicationSchema.safeParse(input).success).toBe(false);
    expect(trialApplicationSchema.safeParse({ ...input, productionMode: 'LAYER' }).success).toBe(true);
    input.sheds[0].performanceProfileId = 'unknown';
    expect(trialApplicationSchema.safeParse({ ...input, productionMode: 'LAYER' }).success).toBe(false);
  });
  it('creates only the existing onboarding script shape', () => {
    const payload = buildOnboardingPayload(trialApplicationSchema.parse(validApplication));

    expect(Object.keys(payload).sort()).toEqual(['config', 'farm', 'owners', 'sheds', 'tenant', 'workers']);
    expect(payload.owners[0]).toMatchObject({
      name: 'Anil Kumar',
      phone: '+919876543210',
      role: 'FARM_OWNER',
    });
    expect(payload.workers[0]).toMatchObject({
      name: 'Ramesh',
      phone: '+919876543211',
      language: 'hi',
      sheds: ['Shed 1'],
      modules: ['FEED', 'MORTALITY'],
    });
    expect(payload.config).toMatchObject({
      productionMode: 'BROILER',
      timezone: 'Asia/Kolkata',
      whatsappDeliveryMode: 'LIVE',
      mortalityAlertPercent: 4,
      feedStockLowThresholdKg: 800,
      paymentReminderDays: 7,
      dailyReminderCron: '0 17 * * *',
      missingEntryAlertCron: '0 18 * * *',
      salesAlertsEnabled: true,
      paymentRemindersEnabled: true,
    });
    expect(payload.sheds[0].batch).toMatchObject({ maleCount: 4500, femaleCount: 0 });
    expect(payload.sheds[0].name).toBe('Shed 1');
    expect(payload.sheds[0].batch.name).toBe('September 2026 Batch');
  });

  it('creates a layer onboarding payload with egg collection and female placements', () => {
    const layerApplication = structuredClone(validApplication);
    layerApplication.productionMode = 'LAYER';
    layerApplication.workers[0].modules = ['FEED', 'MORTALITY', 'EGG_COLLECTION', 'WEIGHT_ENTRY'] as any;

    const payload = buildOnboardingPayload(trialApplicationSchema.parse(layerApplication));

    expect(payload.config.productionMode).toBe('LAYER');
    expect(payload.workers[0].modules).toContain('EGG_COLLECTION');
    expect(payload.sheds[0].batch).toMatchObject({ maleCount: 0, femaleCount: 4500 });
  });

  it('omits an empty opening feed stock record so root onboarding accepts the trial', () => {
    const withoutOpeningStock = structuredClone(validApplication);
    withoutOpeningStock.farm.openingFeedStockKg = 0;
    withoutOpeningStock.farm.openingFeedStockRatePerKg = 0;

    const payload = buildOnboardingPayload(trialApplicationSchema.parse(withoutOpeningStock));

    expect(payload.farm).not.toHaveProperty('openingFeedStockKg');
    expect(payload.farm).not.toHaveProperty('openingFeedStockRatePerKg');
  });

  it('derives shed capacity from birds placed', () => {
    const payload = buildOnboardingPayload(trialApplicationSchema.parse(validApplication));

    expect(payload.sheds[0].capacity).toBe(4500);
  });
});
