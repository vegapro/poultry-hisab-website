import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('trial application migration', () => {
  it('defines the canonical storage contract', async () => {
    const sql = await readFile(new URL('../../database/001_create_trial_applications.sql', import.meta.url), 'utf8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "TrialApplication"');
    expect(sql).toContain('"onboardingPayload" JSONB NOT NULL');
    expect(sql).toContain('TrialApplication_tenantSlug_active_key');
    expect(sql).toContain("'NEW', 'CONTACTED', 'APPROVED'");
  });
});
