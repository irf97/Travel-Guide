import type { FeatureKey, Intent, TravelStyle } from "./types";

const featureKeywords: Record<FeatureKey, string[]> = {
  sea: ["sea", "beach", "coast", "coastal", "harbor", "harbour"],
  historic: ["historic", "history", "old town", "rome", "ancient", "castle", "palace", "museum"],
  seafood: ["seafood", "fish", "fresh fish"],
  local_food: ["local food", "authentic food", "food culture", "market"],
  young_adults: ["young", "young adults", "students", "25", "30"],
  international_crowd: ["international", "travellers", "travelers", "expats", "erasmus"],
  clubs: ["club", "clubs", "clubbing"],
  bars: ["bar", "bars", "pub", "pre-drinks"],
  matcha: ["matcha"],
  baked_goods: ["baked", "pastry", "bakery", "cakes"],
  sports_tv: ["sports tv", "football", "match day", "watch sports"],
  coworking: ["coworking", "co-working"],
  laptop_friendly: ["laptop", "work", "remote work"],
  terrace: ["terrace", "rooftop", "outdoor"],
  live_music: ["live music", "open mic", "music"],
  beach_sports: ["beach volleyball", "beach sports", "surf"],
  language_exchange: ["language exchange"],
  startup_events: ["startup", "founder", "digital nomad", "networking"]
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
  intent.group.size = input.groupSize;
  intent.group.age_range = input.ageRange;
  intent.budget.per_person_eur = input.budget;
  intent.dates.nights = input.nights;
  intent.dates.month = input.month;
  intent.travel_style = [input.style];

  for (const [feature, keywords] of Object.entries(featureKeywords) as [FeatureKey, string[]][]) {
    intent.desired_features[feature] = keywords.some((keyword) => text.includes(keyword));
  }

  intent.avoid.too_crowded = /too crowded|not crowded|less crowded|quiet|calm/.test(text);
  intent.avoid.tourist_traps = /tourist trap|not touristy|authentic/.test(text);
  intent.avoid.expensive = /cheap|budget|not expensive|affordable/.test(text);
  intent.avoid.car_dependent = /no car|walkable|without car|public transport/.test(text);
  intent.avoid.dead_nightlife = /nightlife|bars|clubs|social night/.test(text);

  const active = Object.values(intent.desired_features).filter(Boolean).length;
  intent.confidence.overall = Math.min(0.92, 0.48 + active * 0.045);
  intent.confidence.uncertain_fields = ["clubs", "remote_work", "crowd comfort"].filter((field) => !text.includes(field.replace("_", " ")));
  return intent;
}
