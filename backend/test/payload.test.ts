import { describe, expect, it } from 'vitest';
import { buildOnboardingPayload } from '../src/trial/payload.js';
import { normalizeIndianPhone, trialApplicationSchema } from '../src/trial/schema.js';

const validApplication = {
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
      name: 'Shed 1',
      capacity: 5000,
      batchName: 'September Batch',
      startDate: '2026-09-25',
      birdCount: 4500,
      maleCount: 4500,
      femaleCount: 0,
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

  it('rejects gender totals greater than birds placed', () => {
    const invalid = structuredClone(validApplication);
    invalid.sheds[0].maleCount = 4400;
    invalid.sheds[0].femaleCount = 200;

    expect(() => trialApplicationSchema.parse(invalid)).toThrow('cannot exceed');
  });
});

describe('buildOnboardingPayload', () => {
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
  });
});
