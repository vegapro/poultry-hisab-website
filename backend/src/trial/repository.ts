import type { NewTrialApplication, TrialApplicationRepository } from './types.js';

export interface QueryExecutor {
  query<T extends Record<string, unknown>>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}

export class PostgresTrialApplicationRepository implements TrialApplicationRepository {
  constructor(private readonly database: QueryExecutor) {}

  async tenantSlugExists(slug: string): Promise<boolean> {
    const result = await this.database.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM "Tenant" WHERE "slug" = $1) AS "exists"',
      [slug],
    );
    return result.rows[0]?.exists === true;
  }

  async activeTrialSlugExists(slug: string): Promise<boolean> {
    const result = await this.database.query<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1 FROM "TrialApplication"
        WHERE "tenantSlug" = $1 AND "status" IN ('NEW', 'CONTACTED', 'APPROVED')
      ) AS "exists"`,
      [slug],
    );
    return result.rows[0]?.exists === true;
  }

  async create(record: NewTrialApplication): Promise<{ id: string; status: 'NEW' }> {
    const result = await this.database.query<{ id: string; status: 'NEW' }>(
      `INSERT INTO "TrialApplication" (
        "ownerName", "ownerPhone", "farmName", "tenantSlug", "onboardingPayload"
      ) VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING "id", "status"`,
      [record.ownerName, record.ownerPhone, record.farmName, record.tenantSlug, JSON.stringify(record.onboardingPayload)],
    );
    return result.rows[0]!;
  }
}
