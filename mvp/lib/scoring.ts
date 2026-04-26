import type { City, FeatureKey, Intent, Place } from "./types";

const styleWeights = {
  balanced: { budget: 0.18, seasonality: 0.12, social: 0.18, nightlife: 0.14, history: 0.14, food: 0.12, mobility: 0.08, feature: 0.04 },
  social: { budget: 0.12, seasonality: 0.10, social: 0.28, nightlife: 0.20, history: 0.08, food: 0.08, mobility: 0.08, feature: 0.06 },
  nightlife: { budget: 0.10, seasonality: 0.10, social: 0.22, nightlife: 0.30, history: 0.06, food: 0.06, mobility: 0.08, feature: 0.08 },
  culture: { budget: 0.12, seasonality: 0.12, social: 0.10, nightlife: 0.06, history: 0.30, food: 0.14, mobility: 0.08, feature: 0.08 },
  food: { budget: 0.12, seasonality: 0.10, social: 0.12, nightlife: 0.08, history: 0.12, food: 0.30, mobility: 0.08, feature: 0.08 },
  budget: { budget: 0.34, seasonality: 0.10, social: 0.12, nightlife: 0.08, history: 0.08, food: 0.08, mobility: 0.10, feature: 0.10 },
  "remote-work": { budget: 0.15, seasonality: 0.10, social: 0.14, nightlife: 0.06, history: 0.08, food: 0.10, mobility: 0.22, feature: 0.15 },
  sports: { budget: 0.12, seasonality: 0.10, social: 0.20, nightlife: 0.14, history: 0.06, food: 0.08, mobility: 0.10, feature: 0.20 }
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function activeFeatures(intent: Intent): FeatureKey[] {
  return Object.entries(intent.desired_features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key as FeatureKey);
}

function featureFit(features: FeatureKey[], tags: FeatureKey[], seaAccess?: boolean) {
  if (features.length === 0) return 60;
  const matched = features.filter((feature) => {
    if (feature === "sea" && seaAccess !== undefined) return seaAccess;
    return tags.includes(feature);
  }).length;
  return clampScore((matched / features.length) * 100);
}

export function scoreCity(city: City, intent: Intent) {
  const activeStyle = intent.travel_style[0] ?? "balanced";
  const weights = styleWeights[activeStyle] ?? styleWeights.balanced;
  const month = intent.dates.month ?? "July";
  const estimatedCost = city.base_cost_per_person + (intent.dates.nights - 7) * city.average_daily_cost;
  const budgetFit = clampScore(100 - Math.max(0, estimatedCost - intent.budget.per_person_eur) / 8);
  const seasonality = city.seasonality_by_month[month] ?? 75;
  const feature = featureFit(activeFeatures(intent), [], city.sea_access);

  let riskPenalty = 0;
  if (intent.avoid.car_dependent && city.mobility_score < 75) riskPenalty += 8;
  if (intent.avoid.dead_nightlife && city.nightlife_score < 78) riskPenalty += 8;
  if (intent.avoid.too_crowded && (city.crowd_pressure_by_month[month] ?? 0) > 85) riskPenalty += 7;
  if (intent.avoid.expensive && estimatedCost > intent.budget.per_person_eur * 0.95) riskPenalty += 6;

  const score = clampScore(
    weights.budget * budgetFit +
      weights.seasonality * seasonality +
      weights.social * city.social_density_score +
      weights.nightlife * city.nightlife_score +
      weights.history * city.history_score +
      weights.food * city.food_culture_score +
      weights.mobility * city.mobility_score +
      weights.feature * feature -
      riskPenalty
  );

  return {
    score,
    estimatedCost: Math.round(estimatedCost),
    budgetFit,
    seasonality,
    featureFit: feature,
    riskPenalty,
    explanation: {
      budget_fit: budgetFit,
      seasonality,
      social_density: city.social_density_score,
      nightlife: city.nightlife_score,
      culture_history: city.history_score,
      food_fit: city.food_culture_score,
      mobility_fit: city.mobility_score,
      preference_feature_fit: feature,
      risk_penalties: riskPenalty
    }
  };
}

export function scorePlace(place: Place, intent: Intent, cityScore = 70) {
  const features = activeFeatures(intent);
  const preferenceSimilarity = featureFit(features, place.feature_tags);
  const priceFit = clampScore(100 - (place.price_level - 1) * 16);
  const businessConfirmation = place.business_confirmed ? 100 : 55;

  let score =
    0.28 * preferenceSimilarity +
    0.17 * place.social_ambience_score +
    0.15 * priceFit +
    0.15 * place.evidence_confidence_score +
    0.13 * businessConfirmation +
    0.12 * cityScore;

  if (intent.travel_style.includes("food") && place.feature_tags.includes("seafood")) score += 5;
  if (intent.travel_style.includes("sports") && place.feature_tags.includes("sports_tv")) score += 5;
  if (intent.travel_style.includes("remote-work") && place.feature_tags.includes("laptop_friendly")) score += 5;

  return {
    score: clampScore(score),
    explanation: {
      preference_similarity: preferenceSimilarity,
      feature_match: preferenceSimilarity,
      social_ambience: place.social_ambience_score,
      price_fit: priceFit,
      business_confirmation: businessConfirmation,
      evidence_confidence: place.evidence_confidence_score,
      location_fit: cityScore
    }
  };
}
