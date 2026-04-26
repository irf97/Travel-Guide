import type { FeatureKey, Intent, TravelStyle } from "./types";

const featureKeywords: Record<FeatureKey, string[]> = {
  sea: ["sea", "beach", "coast", "coastal", "harbor", "harbour", "by the water", "seaside"],
  historic: ["historic", "history", "old town", "rome", "ancient", "castle", "palace", "museum", "heritage", "old city"],
  seafood: ["seafood", "fish", "fresh fish", "oysters", "shellfish"],
  local_food: ["local food", "authentic food", "food culture", "market", "fresh food", "traditional food"],
  young_adults: ["young", "young adults", "students", "25", "30", "student"],
  international_crowd: ["international", "travellers", "travelers", "expats", "erasmus", "foreigners", "mixed crowd"],
  clubs: ["club", "clubs", "clubbing", "dance"],
  bars: ["bar", "bars", "pub", "pre-drinks", "cocktails", "drinks"],
  matcha: ["matcha"],
  baked_goods: ["baked", "pastry", "bakery", "cakes", "croissant"],
  sports_tv: ["sports tv", "football", "match day", "watch sports", "screening", "game night"],
  coworking: ["coworking", "co-working", "work space", "workspace"],
  laptop_friendly: ["laptop", "work", "remote work", "wifi", "study"],
  terrace: ["terrace", "rooftop", "outdoor", "patio"],
  live_music: ["live music", "open mic", "music", "jazz", "concert"],
  beach_sports: ["beach volleyball", "beach sports", "surf", "watersport", "sports on the beach"],
  language_exchange: ["language exchange", "language night"],
  startup_events: ["startup", "founder", "digital nomad", "networking", "meetup"]
};

export function defaultIntent(): Intent {
  return {
    group: { size: 5, age_range: "25-30" },
    budget: { per_person_eur: 1000, sensitivity: "medium" },
    dates: { mode: "month", month: "July", start_date: null, end_date: null, nights: 7 },
    travel_style: ["balanced"],
    desired_features: Object.fromEntries(Object.keys(featureKeywords).map((key) => [key, false])) as Intent["desired_features"],
    avoid: {
      too_crowded: false,
      tourist_traps: false,
      expensive: false,
      family_only: false,
      car_dependent: false,
      dead_nightlife: false
    },
    confidence: { overall: 0.64, uncertain_fields: [] }
  };
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function inferStyles(text: string, fallback: TravelStyle): TravelStyle[] {
  const styles = new Set<TravelStyle>();
  if (/social|meet people|international|friends|network/.test(text)) styles.add("social");
  if (/nightlife|club|bar|party|pre-drink/.test(text)) styles.add("nightlife");
  if (/historic|history|old town|museum|culture|rome/.test(text)) styles.add("culture");
  if (/food|seafood|restaurant|market|local/.test(text)) styles.add("food");
  if (/cheap|budget|affordable|not expensive/.test(text)) styles.add("budget");
  if (/remote work|coworking|laptop|wifi/.test(text)) styles.add("remote-work");
  if (/sports|football|volleyball|surf/.test(text)) styles.add("sports");
  if (styles.size === 0) styles.add(fallback);
  return [...styles].slice(0, 3);
}

export function extractIntentLocally(input: {
  text: string;
  groupSize: number;
  ageRange: string;
  budget: number;
  nights: number;
  month: string;
  style: TravelStyle;
}): Intent {
  const text = input.text.toLowerCase();
  const intent = defaultIntent();
  intent.group.size = Number.isFinite(input.groupSize) ? input.groupSize : 5;
  intent.group.age_range = input.ageRange || "25-30";
  intent.budget.per_person_eur = Number.isFinite(input.budget) ? input.budget : 1000;
  intent.budget.sensitivity = intent.budget.per_person_eur < 800 ? "high" : intent.budget.per_person_eur > 1400 ? "low" : "medium";
  intent.dates.nights = Number.isFinite(input.nights) ? input.nights : 7;
  intent.dates.month = input.month || "July";
  intent.travel_style = inferStyles(text, input.style);

  for (const [feature, keywords] of Object.entries(featureKeywords) as [FeatureKey, string[]][]) {
    intent.desired_features[feature] = containsAny(text, keywords);
  }

  intent.avoid.too_crowded = /too crowded|not crowded|less crowded|quiet|calm|avoid crowds|crowd comfort/.test(text);
  intent.avoid.tourist_traps = /tourist trap|not touristy|authentic|local/.test(text);
  intent.avoid.expensive = /cheap|budget|not expensive|affordable|low cost/.test(text);
  intent.avoid.family_only = /not family|no family|young adults only|avoid family/.test(text);
  intent.avoid.car_dependent = /no car|walkable|without car|public transport|no taxi|avoid taxis/.test(text);
  intent.avoid.dead_nightlife = /nightlife|bars|clubs|social night|not dead/.test(text);

  const active = Object.values(intent.desired_features).filter(Boolean).length;
  const avoidCount = Object.values(intent.avoid).filter(Boolean).length;
  intent.confidence.overall = Math.min(0.94, 0.5 + active * 0.035 + avoidCount * 0.025);
  intent.confidence.uncertain_fields = [
    intent.desired_features.clubs ? null : "clubs",
    intent.desired_features.coworking ? null : "remote_work",
    intent.avoid.too_crowded ? null : "crowd_comfort"
  ].filter(Boolean) as string[];
  return intent;
}
