# PoultryHisab Website

Standalone public website and manual trial-intake service. It uses the existing Neon PostgreSQL project; it does not create a second database, a live tenant, users, messages, or farm records automatically.

## Deploy

Deploy this repository as a separate Railway project with two services:

- `backend`: the Express API.
- `frontend`: the Vite static site.

Run the following SQL once in the Neon SQL Editor connected to the same database as PoultryHisab:

```sql
-- Run the contents of database/001_create_trial_applications.sql
```

For the backend service, set:

- `DATABASE_URL`: existing Neon PostgreSQL connection string.
- `CORS_ORIGIN`: exact deployed frontend origin, for example `https://poultryhisab.example.com`.
- `PORT`: Railway-provided port, or `3000` locally.

For the frontend service, set build-time variables:

- `VITE_API_BASE_URL`: deployed backend origin, without a trailing slash.
- `VITE_MAIN_APP_URL`: existing PoultryHisab owner application URL for Login.

After assigning the frontend domain, update the backend `CORS_ORIGIN` to that exact origin and redeploy the backend. For local development, use `http://localhost:5173` as `CORS_ORIGIN`, start the backend with `npm run dev` from `backend`, and start the frontend with `npm run dev` from `frontend`.

## Review trial requests

Access the Neon SQL Editor only through the authenticated internal account and run:

```sql
SELECT "id", "ownerName", "ownerPhone", "farmName", "tenantSlug", "onboardingPayload", "createdAt"
FROM "TrialApplication"
WHERE "status" = 'NEW'
ORDER BY "createdAt" DESC;
```

Each row is a manual-contact request. The public site never provisions an account and never sends a WhatsApp acknowledgement.

## Manual onboarding handoff

1. Contact the owner and verify the farm, sheds, workers, phone numbers, and starting-batch details.
2. Copy the row's `onboardingPayload` JSON into `/Users/anuragshukla/Documents/poultryHisab/docs/client-onboarding.json`.
3. From the main PoultryHisab repository, validate it without writing tenant data:

   ```bash
   npm run tenant:onboard -- docs/client-onboarding.json --dry-run
   ```

4. Review the dry-run result. Only then run the same command without `--dry-run` to create the live tenant.
5. After successful onboarding, update the request's status to `ONBOARDED` and set `onboardedAt`. Do not mark it onboarded before the root script succeeds.

The generated payload is intentionally normal JSON, compatible with the existing onboarding script and safe to copy directly into `docs/client-onboarding.json`.
