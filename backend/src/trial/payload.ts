import { allowedEntryModulesForMode, type OnboardingPayload, type TrialApplicationInput } from './types.js';

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
      productionMode: input.productionMode,
      mortalityAlertPercent: input.preferences.mortalityAlertPercent,
      feedStockLowThresholdKg: input.preferences.feedStockLowThresholdKg,
      paymentReminderDays: input.preferences.paymentReminderDays,
    },
    farm: {
      name: input.farm.name,
      ...(input.farm.location ? { location: input.farm.location } : {}),
      ...(input.farm.openingFeedStockKg > 0 ? {
        openingFeedStockKg: input.farm.openingFeedStockKg,
        openingFeedStockRatePerKg: input.farm.openingFeedStockRatePerKg,
      } : {}),
    },
    sheds: input.sheds.map((shed, index) => ({
      name: `Shed ${index + 1}`,
      capacity: shed.birdCount,
      batch: {
        ...(input.productionMode === 'LAYER' && shed.performanceProfileId ? { performanceProfileId: shed.performanceProfileId } : {}),
        name: `${new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${shed.startDate}T00:00:00.000Z`))} Batch`,
        startDate: shed.startDate,
        birdCount: shed.birdCount,
        maleCount: input.productionMode === 'BROILER' ? shed.birdCount : 0,
        femaleCount: input.productionMode === 'LAYER' ? shed.birdCount : 0,
      },
    })),
    owners: [{ name: input.owner.name, phone: input.owner.phone, role: 'FARM_OWNER' }],
    workers: input.workers.map((worker) => ({
      name: worker.name,
      phone: worker.phone,
      language: worker.language,
      sheds: worker.sheds,
      modules: worker.modules.filter((module) => allowedEntryModulesForMode(input.productionMode).includes(module)),
    })),
  };
}
