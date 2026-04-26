# Social Travel Intelligence OS — Production MVP

A Next.js 14 production MVP scaffold for a social-context travel decision engine.

## Product thesis

Travel planning with social context, not shallow descriptions.

The app translates messy traveler preference into structured intent, then ranks cities, neighborhoods, places, opt-in social opportunities, and daily routes.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Zod validation
- Prisma schema for PostgreSQL / Supabase
- Supabase Auth + Storage planned
- OpenAI structured extraction planned
- Static seed data for Phase 1

## Local setup

```bash
cd mvp
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Vercel deployment

Set the Vercel project root directory to:

```text
mvp
```

Add environment variables from `.env.example`.

## Implementation phases

### Phase 1
- App shell
- Landing page
- Static seed data
- Traveler intake
- Local structured extraction simulation
- Destination ranking
- Place ranking
- Temporary city/place simulators
- Cost model
- Trust/safety and architecture docs

### Phase 2
- Supabase database
- Prisma migrations
- Persist trips and preference profiles
- Persist places and business profiles
- Supabase Auth for business portal

### Phase 3
- OpenAI structured extraction endpoint
- Voice transcription endpoint
- Image analysis endpoint
- Strict Zod validation for all AI output

### Phase 4
- Itinerary/social route generator
- Feedback calibration
- Business claim workflow
- Admin dashboard

### Phase 5
- Real map/place data integration
- Production legal/privacy pages
- Monitoring and analytics
- Payments/business subscriptions later

## Safety rules

- This is not a dating app.
- Do not recommend individual people.
- Do not scrape personal profiles.
- Do not optimize around gender targeting.
- Use demographic/context data only as aggregate travel context.
- Recommend environments, places, and opt-in events only.
- Do not identify private individuals in images.
- Do not infer sensitive traits.
