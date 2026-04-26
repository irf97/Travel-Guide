# Social Travel Intelligence OS — Product Architecture

## Definition

Social Travel Intelligence OS is a social-context travel decision engine.

It is not a booking site, normal travel guide, generic itinerary generator, or dating app.

The system translates messy human travel/social preference into structured intent, then recommends:

- cities
- neighborhoods
- restaurants
- cafés
- bars
- coworking spaces
- sports spots
- third spaces
- cultural/historic places
- opt-in social events
- itinerary/social routes

## Core pipeline

```text
Voice/text preference
→ transcription if voice
→ structured preference extraction
→ validated intent schema
→ city/neighborhood scoring
→ place/event scoring
→ business-confirmed ambience layer
→ itinerary/social route generation
→ user feedback
→ calibration
```

## System separation

```text
LLM
  Translates messy user preference into structured intent.
  Does not make final unchecked decisions.

Database
  Stores verified place reality, user trips, business profiles, images, feedback.

Image model
  Detects venue-level features and ambience evidence.
  Does not identify private individuals or sensitive traits.

Business UI
  Lets businesses confirm real ambience, features, best times, and media evidence.

Scoring engine
  Makes transparent ranking decisions from structured data.

Feedback loop
  Calibrates future recommendations based on actual user outcomes.
```

## Scoring formulas

### City score

```text
city_score =
  budget_fit
+ seasonality
+ social_density
+ nightlife
+ culture_history
+ food_fit
+ mobility_fit
+ preference_feature_fit
- risk_penalties
```

### Place score

```text
place_score =
  preference_similarity
+ feature_match
+ social_ambience
+ price_fit
+ business_confirmation
+ evidence_confidence
+ location_fit
```

## Safety boundaries

- Do not make this a dating app.
- Do not recommend individual people.
- Do not scrape personal profiles.
- Do not optimize around gender targeting.
- Use demographic/context data only as aggregate travel context.
- Recommend environments, places, and opt-in events only.
- Do not identify private individuals in images.
- Do not infer sensitive traits.
- Do not rank attractiveness.
- Business images require ownership or consent.

## Implementation phases

### Phase 1

- Next.js app shell
- Static seed data
- Traveler intake
- Local structured extraction simulation
- Destination ranking
- Place ranking
- Temporary place simulator
- API route stubs
- Prisma schema

### Phase 2

- Supabase database
- Prisma migrations
- Persist trips and preference profiles
- Persist places and business profiles
- Supabase Auth for business portal
- Supabase Storage for business/place images

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
- Production privacy/legal pages
- Monitoring and analytics
- Payment/business subscription layer
