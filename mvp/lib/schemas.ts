import { z } from "zod";

export const featureSchema = z.object({
  sea: z.boolean(),
  historic: z.boolean(),
  seafood: z.boolean(),
  local_food: z.boolean(),
  young_adults: z.boolean(),
  international_crowd: z.boolean(),
  clubs: z.boolean(),
  bars: z.boolean(),
  matcha: z.boolean(),
  baked_goods: z.boolean(),
  sports_tv: z.boolean(),
  coworking: z.boolean(),
  laptop_friendly: z.boolean(),
  terrace: z.boolean(),
  live_music: z.boolean(),
  beach_sports: z.boolean(),
  language_exchange: z.boolean(),
  startup_events: z.boolean()
});

export const avoidSchema = z.object({
  too_crowded: z.boolean(),
  tourist_traps: z.boolean(),
  expensive: z.boolean(),
  family_only: z.boolean(),
  car_dependent: z.boolean(),
  dead_nightlife: z.boolean()
});

export const intentSchema = z.object({
  group: z.object({
    size: z.number().int().min(1).max(50),
    age_range: z.string().min(1)
  }),
  budget: z.object({
    per_person_eur: z.number().int().min(100).max(20000),
    sensitivity: z.enum(["low", "medium", "high"])
  }),
  dates: z.object({
    mode: z.enum(["month", "exact"]),
    month: z.string().nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    nights: z.number().int().min(1).max(60)
  }),
  travel_style: z.array(z.enum(["balanced", "social", "nightlife", "culture", "food", "budget", "remote-work", "sports"])).min(1),
  desired_features: featureSchema,
  avoid: avoidSchema,
  confidence: z.object({
    overall: z.number().min(0).max(1),
    uncertain_fields: z.array(z.string())
  })
});

export const intakeRequestSchema = z.object({
  text: z.string().min(1).max(4000),
  group_size: z.number().int().min(1).max(50),
  age_range: z.string().min(1),
  budget_per_person: z.number().int().min(100).max(20000),
  nights: z.number().int().min(1).max(60),
  month: z.string().optional(),
  travel_style: z.array(z.string()).optional()
});

export const tempPlaceSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  city_id: z.string().min(1),
  neighborhood: z.string().min(1),
  price_level: z.number().int().min(1).max(5),
  feature_tags: z.array(z.string()),
  ambience_description: z.string().optional(),
  social_score: z.number().min(0).max(100),
  evidence_score: z.number().min(0).max(100),
  business_confirmed: z.boolean(),
  notes: z.string().optional()
});
