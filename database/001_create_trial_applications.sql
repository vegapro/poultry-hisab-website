DO $$
BEGIN
  CREATE TYPE "TrialApplicationStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'APPROVED',
    'REJECTED',
    'ONBOARDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "TrialApplication" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "status" "TrialApplicationStatus" NOT NULL DEFAULT 'NEW',
  "ownerName" TEXT NOT NULL,
  "ownerPhone" TEXT NOT NULL,
  "farmName" TEXT NOT NULL,
  "tenantSlug" TEXT NOT NULL,
  "onboardingPayload" JSONB NOT NULL,
  "notes" TEXT,
  "contactedAt" TIMESTAMPTZ,
  "onboardedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrialApplication_tenantSlug_active_key"
  ON "TrialApplication" ("tenantSlug")
  WHERE "status" IN ('NEW', 'CONTACTED', 'APPROVED');

CREATE INDEX IF NOT EXISTS "TrialApplication_status_createdAt_idx"
  ON "TrialApplication" ("status", "createdAt" DESC);

