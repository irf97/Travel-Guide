import { z } from "zod";

export const travelStyleSchema = z.enum(["balanced", "social", "nightlife", "culture", "food", "budget", "remote-work", "sports"]);
export const featureKeySchema = z.enum(["sea", "historic", "seafood", "local_food", "young_adults", "international_crowd", "clubs", "bars", "matcha", "baked_goods", "sports_tv", "coworking", "laptop_friendly", "terrace", "live_music", "beach_sports", "language_exchange", "startup_events"]);
export const avoidKeySchema = z.enum(["too_crowded", "tourist_traps", "expensive", "family_only", "car_dependent", "dead_nightlife"]);
export const continentSchema = z.enum(["Europe", "Asia", "Africa", "North America", "South America", "Oceania"]);

const featureRecord = z.object(Object.fromEntries(featureKeySchema.options.map((key) => [key, z.boolean()])) as Record<(typeof featureKeySchema.options)[number], z.ZodBoolean>);
const avoidRecord = z.object(Object.fromEntries(avoidKeySchema.options.map((key) => [key, z.boolean()])) as Record<(typeof avoidKeySchema.options)[number], z.ZodBoolean>);

export const intentSchema = z.object({
  group: z.object({ size: z.number().int().min(1).max(50), age_range: z.string().min(1).max(40) }),
  budget: z.object({ per_person_eur: z.number().min(0).max(100000), sensitivity: z.enum(["low", "medium", "high"]) }),
  dates: z.object({ mode: z.enum(["month", "exact"]), month: z.string().nullable(), start_date: z.string().nullable(), end_date: z.string().nullable(), nights: z.number().int().min(1).max(365) }),
  travel_style: z.array(travelStyleSchema).min(1).max(8),
  desired_features: featureRecord,
  avoid: avoidRecord,
  confidence: z.object({ overall: z.number().min(0).max(1), uncertain_fields: z.array(z.string()) })
});

export const intakeExtractRequestSchema = z.object({
  text: z.string().min(0).max(8000).default(""),
  groupSize: z.number().int().min(1).max(50).default(5),
  ageRange: z.string().min(1).max(40).default("25-30"),
  budget: z.number().min(0).max(100000).default(1000),
  nights: z.number().int().min(1).max(365).default(7),
  month: z.string().min(1).max(20).default("July"),
  style: travelStyleSchema.default("balanced"),
  useAi: z.boolean().default(false)
});

export const cityRecommendRequestSchema = z.object({
  intent: intentSchema,
  topN: z.number().int().min(1).max(500).default(25),
  continent: z.union([continentSchema, z.literal("All")]).default("All"),
  budgetCap: z.number().min(0).optional(),
  seaAccess: z.boolean().optional(),
  minNightlife: z.number().min(0).max(100).optional(),
  minHistory: z.number().min(0).max(100).optional(),
  minSocialDensity: z.number().min(0).max(100).optional()
});

export const worldRecommendRequestSchema = cityRecommendRequestSchema.extend({
  metric: z.enum(["score", "cost", "nightlife", "history", "social"]).default("score"),
  selectedCityId: z.string().optional()
});

export const placeRecommendRequestSchema = z.object({
  intent: intentSchema,
  cityId: z.string().optional(),
  topN: z.number().int().min(1).max(500).default(25),
  placeTypes: z.array(z.string()).default([]),
  goodFor: z.array(z.string()).default([]),
  maxPriceLevel: z.number().int().min(1).max(5).optional()
});

export const tempCityScoreRequestSchema = z.object({
  intent: intentSchema,
  city: z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    country: z.string().min(1),
    continent: continentSchema.default("Europe"),
    lat: z.number().default(0),
    lng: z.number().default(0),
    types: z.array(z.string()).default([]),
    base_cost_per_person: z.number().min(0).default(800),
    average_daily_cost: z.number().min(0).default(60),
    social_density_score: z.number().min(0).max(100).default(75),
    nightlife_score: z.number().min(0).max(100).default(75),
    history_score: z.number().min(0).max(100).default(75),
    food_culture_score: z.number().min(0).max(100).default(75),
    mobility_score: z.number().min(0).max(100).default(75),
    sea_access: z.boolean().default(false),
    best_neighborhoods: z.array(z.string()).default([]),
    risk_flags: z.array(z.string()).default([]),
    notes: z.string().default("")
  })
});

export const tempPlaceScoreRequestSchema = z.object({
  intent: intentSchema,
  cityScore: z.number().min(0).max(100).default(70),
  place: z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    type: z.string().min(1),
    city_id: z.string().min(1),
    neighborhood: z.string().default("Custom"),
    ambience_tags: z.array(z.string()).default([]),
    feature_tags: z.array(featureKeySchema).default([]),
    price_level: z.number().int().min(1).max(5).default(2),
    social_ambience_score: z.number().min(0).max(100).default(70),
    evidence_confidence_score: z.number().min(0).max(100).default(60),
    business_confirmed: z.boolean().default(false),
    good_for: z.array(z.string()).default([]),
    notes: z.string().default("")
  })
});

export const businessProfileRequestSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(160),
  address: z.string().max(260).optional().default(""),
  city: z.string().max(100).optional().default(""),
  neighborhood: z.string().max(120).optional().default(""),
  type: z.string().max(80).default("venue"),
  openingHours: z.string().max(500).optional().default(""),
  website: z.string().url().optional().or(z.literal("")),
  instagram: z.string().max(160).optional().default(""),
  tiktok: z.string().max(160).optional().default(""),
  reservationLink: z.string().url().optional().or(z.literal("")),
  priceRange: z.string().max(80).optional().default(""),
  languagesSpoken: z.array(z.string()).default([]),
  ambience: z.record(z.string(), z.number().min(0).max(1)).default({}),
  features: z.record(z.string(), z.boolean()).default({}),
  bestTimes: z.record(z.string(), z.boolean()).default({}),
  mediaConsentConfirmed: z.boolean().default(false)
});

export const imageAnalyzeRequestSchema = z.object({
  imageUrls: z.array(z.string()).default([]),
  filenameHints: z.array(z.string()).default([]),
  placeId: z.string().optional(),
  businessProfileId: z.string().optional(),
  consentConfirmed: z.boolean().default(false),
  useAi: z.boolean().default(false)
});

export const itineraryGenerateRequestSchema = z.object({
  intent: intentSchema,
  cityId: z.string(),
  placeIds: z.array(z.string()).default([]),
  eventIds: z.array(z.string()).default([]),
  intensity: z.enum(["low", "balanced", "high"]).default("balanced"),
  days: z.number().int().min(1).max(60).default(4)
});

export const feedbackRequestSchema = z.object({
  tripId: z.string().optional(),
  targetType: z.enum(["city", "place", "event", "route"]),
  targetId: z.string(),
  rating: z.number().min(1).max(5),
  matchedExpectation: z.boolean(),
  crowdAccuracy: z.number().min(0).max(100).optional(),
  socialAccuracy: z.number().min(0).max(100).optional(),
  budgetAccuracy: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional().default("")
});

export const costModelRequestSchema = z.object({
  monthlyActiveUsers: z.number().int().min(0).default(1000),
  voiceNotesPerUser: z.number().min(0).default(2),
  imageAnalysesPerMonth: z.number().int().min(0).default(1000),
  llmRecommendationsPerUser: z.number().min(0).default(4),
  placesInDatabase: z.number().int().min(0).default(5000),
  businessesClaimed: z.number().int().min(0).default(250),
  storagePerImageMb: z.number().min(0).default(1.5),
  apiCostMultiplier: z.number().min(0).max(100).default(1)
});

export type IntentPayload = z.infer<typeof intentSchema>;
