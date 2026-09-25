export const ENTRY_MODULES = ['FEED', 'MORTALITY', 'EGG_COLLECTION', 'WEIGHT_ENTRY'] as const;

export type EntryModule = (typeof ENTRY_MODULES)[number];

export interface TrialApplicationInput {
  owner: {
    name: string;
    phone: string;
  };
  farm: {
    name: string;
    location?: string;
    openingFeedStockKg: number;
    openingFeedStockRatePerKg: number;
  };
  preferences: {
    feedStockLowThresholdKg: number;
    mortalityAlertPercent: number;
    paymentReminderDays: number;
  };
  sheds: Array<{
    name: string;
    capacity: number;
    batchName: string;
    startDate: string;
    birdCount: number;
    maleCount: number;
    femaleCount: number;
  }>;
  workers: Array<{
    name: string;
    phone: string;
    language: 'hinglish' | 'hi';
    sheds: string[];
    modules: EntryModule[];
  }>;
}

export interface OnboardingPayload {
  tenant: { name: string; slug: string };
  config: {
    timezone: string;
    whatsappDeliveryMode: 'LIVE';
    mortalityAlertPercent: number;
    feedStockLowThresholdKg: number;
    feedReminderCron: string;
    dailyReminderCron: string;
    vaccinationReminderCron: string;
    missingEntryAlertCron: string;
    weeklyReportCron: string;
    monthlyReportCron: string;
    paymentReminderDays: number;
    salesAlertsEnabled: boolean;
    paymentRemindersEnabled: boolean;
  };
  farm: {
    name: string;
    location?: string;
    openingFeedStockKg: number;
    openingFeedStockRatePerKg: number;
  };
  sheds: Array<{
    name: string;
    capacity: number;
    batch: {
      name: string;
      startDate: string;
      birdCount: number;
      maleCount: number;
      femaleCount: number;
    };
  }>;
  owners: Array<{ name: string; phone: string; role: 'FARM_OWNER' }>;
  workers: Array<{
    name: string;
    phone: string;
    language: 'hinglish' | 'hi';
    sheds: string[];
    modules: EntryModule[];
  }>;
}

export interface NewTrialApplication {
  ownerName: string;
  ownerPhone: string;
  farmName: string;
  tenantSlug: string;
  onboardingPayload: OnboardingPayload;
}

export interface TrialApplicationRepository {
  tenantSlugExists(slug: string): Promise<boolean>;
  activeTrialSlugExists(slug: string): Promise<boolean>;
  create(record: NewTrialApplication): Promise<{ id: string; status: 'NEW' }>;
}
