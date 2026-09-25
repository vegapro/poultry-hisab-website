import type { OnboardingPayload, TrialApplicationInput } from './types.js';

const DEFAULT_CONFIG = {
  timezone: 'Asia/Kolkata',
  whatsappDeliveryMode: 'LIVE' as const,
  feedReminderCron: '0 0 1 1 *',
  dailyReminderCron: '0 17 * * *',
  vaccinationReminderCron: '0 0 1 1 *',
  missingEntryAlertCron: '0 18 * * *',
  weeklyReportCron: '0 10 * * 1',
  monthlyReportCron: '0 10 1 * *',
  salesAlertsEnabled: true,
  paymentRemindersEnabled: true,
};

export function slugifyFarmName(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    throw new Error('Farm name must contain at least one English letter or number.');
  }

  return slug;
}

export function buildOnboardingPayload(input: TrialApplicationInput): OnboardingPayload {
  return {
    tenant: { name: input.farm.name, slug: slugifyFarmName(input.farm.name) },
    config: {
      ...DEFAULT_CONFIG,
      mortalityAlertPercent: input.preferences.mortalityAlertPercent,
      feedStockLowThresholdKg: input.preferences.feedStockLowThresholdKg,
      paymentReminderDays: input.preferences.paymentReminderDays,
    },
    farm: {
      name: input.farm.name,
      ...(input.farm.location ? { location: input.farm.location } : {}),
      openingFeedStockKg: input.farm.openingFeedStockKg,
      openingFeedStockRatePerKg: input.farm.openingFeedStockRatePerKg,
    },
    sheds: input.sheds.map((shed) => ({
      name: shed.name,
      capacity: shed.capacity,
      batch: {
        name: shed.batchName,
        startDate: shed.startDate,
        birdCount: shed.birdCount,
        maleCount: shed.maleCount,
        femaleCount: shed.femaleCount,
      },
    })),
    owners: [{ name: input.owner.name, phone: input.owner.phone, role: 'FARM_OWNER' }],
    workers: input.workers.map((worker) => ({
      name: worker.name,
      phone: worker.phone,
      language: worker.language,
      sheds: worker.sheds,
      modules: worker.modules,
    })),
  };
}
