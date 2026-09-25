# PoultryHisab Website

Standalone public website and manual trial-intake service. It uses the existing Neon PostgreSQL project; it does not create a second database or provision a tenant automatically.

## Database migration

In Neon SQL Editor, connected to the same PostgreSQL database used by PoultryHisab, run `database/001_create_trial_applications.sql` once. This creates only the `TrialApplication` table and its enum/indexes.

## Local environment

Copy `backend/.env.example` to `backend/.env` and set:

- `DATABASE_URL`: existing Neon PostgreSQL connection string.
- `CORS_ORIGIN`: public frontend origin, or `http://localhost:5173` locally.
- `PORT`: API port, normally `3000`.

Copy `frontend/.env.example` to `frontend/.env` and set:

- `VITE_API_BASE_URL`: deployed API origin.
- `VITE_MAIN_APP_URL`: existing PoultryHisab owner application URL used by Login.

## Manual onboarding

Trial submissions are saved for manual contact only. An operator will later read `TrialApplication.onboardingPayload`, copy it into `/Users/anuragshukla/Documents/poultryHisab/docs/client-onboarding.json`, run `npm run tenant:onboard -- docs/client-onboarding.json --dry-run`, then run the same command without `--dry-run` after review.
