export type TravelStyle =
  | "balanced"
  | "social"
  | "nightlife"
  | "culture"
  | "food"
  | "budget"
  | "remote-work"
  | "sports";

export type FeatureKey =
  | "sea"
  | "historic"
  | "seafood"
  | "local_food"
  | "young_adults"
  | "international_crowd"
  | "clubs"
  | "bars"
  | "matcha"
  | "baked_goods"
  | "sports_tv"
  | "coworking"
  | "laptop_friendly"
  | "terrace"
  | "live_music"
  | "beach_sports"
  | "language_exchange"
  | "startup_events";

export type AvoidKey =
  | "too_crowded"
  | "tourist_traps"
  | "expensive"
  | "family_only"
  | "car_dependent"
  | "dead_nightlife";

export type Intent = {
  group: { size: number; age_range: string };
  budget: { per_person_eur: number; sensitivity: "low" | "medium" | "high" };
  dates: {
    mode: "month" | "exact";
    month: string | null;
    start_date: string | null;
    end_date: string | null;
    nights: number;
  };
  travel_style: TravelStyle[];
  desired_features: Record<FeatureKey, boolean>;
  avoid: Record<AvoidKey, boolean>;
  confidence: { overall: number; uncertain_fields: string[] };
};

export type City = {
  id: string;
  name: string;
  country: string;
  types: string[];
  base_cost_per_person: number;
  average_daily_cost: number;
  social_density_score: number;
  nightlife_score: number;
  history_score: number;
  food_culture_score: number;
  mobility_score: number;
  sea_access: boolean;
  crowd_pressure_by_month: Record<string, number>;
  seasonality_by_month: Record<string, number>;
  best_neighborhoods: string[];
  risk_flags: string[];
  nationality_mix_context: string;
  notes: string;
};

export type Place = {
  id: string;
  name: string;
  type: string;
  city_id: string;
  neighborhood: string;
  ambience_tags: string[];
  feature_tags: FeatureKey[];
  price_level: 1 | 2 | 3 | 4 | 5;
  social_ambience_score: number;
  evidence_confidence_score: number;
  business_confirmed: boolean;
  good_for: string[];
  notes: string;
};

export type EventOpportunity = {
  id: string;
  name: string;
  category: string;
  city_id: string;
  tags: FeatureKey[];
  notes: string;
};
