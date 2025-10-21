# Cron Worker

This package contains the scheduled job logic for the `new-words` Nx workspace.

## Overview
- **Entry point:** `apps/cron-worker/src/main.ts`
- **Shared utilities:** import Meduza API client from `meduza-api-client`
- **Output:** build artifacts under `dist/apps/cron-worker`

## Local development
Install dependencies at the workspace root, then use Nx to lint, test, and run the worker:

```bash
npm install
npx nx lint cron-worker
npx nx test cron-worker
npx nx serve cron-worker # builds then runs the worker once
```

For incremental development you can rebuild without executing the output:

```bash
npx nx build cron-worker
node dist/apps/cron-worker/main.js
```

## Environment configuration
Provide any required secrets (e.g., Meduza API configuration) via environment variables or an `.env` file that you load in `apps/cron-worker/src/main.ts`.

## Scheduling with cron
Build the worker for production and point the cron job to the compiled script:

```bash
npx nx build cron-worker --configuration=production
```

Example crontab entry (runs every 5 minutes):

```cron
*/5 * * * * cd /path/to/new-words && npx nx build cron-worker --configuration=production && node dist/apps/cron-worker/main.js >> /var/log/cron-worker.log 2>&1
```

Adjust the schedule, log location, and configuration flags as needed for your environment.
