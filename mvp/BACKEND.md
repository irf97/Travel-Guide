# Social Travel Intelligence OS Backend

This backend is designed to be safe in public GitHub + Vercel deployments.

## Build rule

The app must build even when these are missing:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- external provider keys

Missing credentials should produce fallback or `not_configured` responses, not build failures.

## Health check

`GET /api/health`

Returns adapter status for:

- Prisma database
- Supabase/storage
- gated OpenAI adapter

## Safe adapters

- `lib/server/db.ts` returns Prisma only when `DATABASE_URL` exists.
- `lib/server/supabase.ts` returns Supabase only when URL + service role key exist.
- `lib/server/openai-adapter.ts` returns local fallback unless `OPENAI_API_KEY` exists and AI is explicitly requested.

## Image upload

`POST /api/images/upload`

Form fields:

- `file`: image blob
- `placeId`: optional place id
- `consentConfirmed`: must be `true`
- `useAi`: optional; OpenAI remains gated

If Supabase storage is missing, the route returns a safe fallback response.

## Existing API routes

- `/api/intake/extract`
- `/api/cities/recommend`
- `/api/world/recommend`
- `/api/places/recommend`
- `/api/cities/temp-score`
- `/api/places/temp-score`
- `/api/business/profile`
- `/api/images/analyze`
- `/api/images/upload`
- `/api/itinerary/generate`
- `/api/feedback`
- `/api/cost-model`
- `/api/health`

## Prisma

Schema path:

`prisma/schema.prisma`

The schema includes product tables, user/trip structures, provider status, raw snapshots, price snapshots, analytics events, ingestion runs, and image metadata.

Run locally only when `DATABASE_URL` is configured:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Vercel root directory

The real app lives in `mvp/`. Vercel should use `mvp` as the project root directory, not repository root.

## Lockfile note

At the time of this backend scaffold, no lockfile was found in `mvp/`. After adding dependencies like `react-globe.gl` and `three`, generate and commit a lockfile from the same package manager Vercel uses to reduce install drift.

## External data architecture

Do not call heavy data providers from client components or during build.

Correct flow:

```text
open/commercial sources → ingestion/cache → normalized DB → internal API routes → frontend
```

Heavy Overture/FSQ bulk ingestion should run in GitHub Actions, Hetzner, or another worker, not inside a Vercel serverless request.
