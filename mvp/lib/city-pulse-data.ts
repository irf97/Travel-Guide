import type { WorldCity } from "./world-data";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getStoredCityPulse(city: WorldCity) {
  const articleCount = Math.max(8, Math.round(city.social_density_score / 3 + city.tourism_score_placeholder ?? 0));
  const eventMomentum = clamp(city.nightlife_score * 0.42 + city.social_density_score * 0.38 + city.history_score * 0.2);
  const riskScore = clamp(38 + (city.risk_flags.length * 8) + (city.base_cost_per_person > 1200 ? 4 : 0));
  const demandPressure = clamp(eventMomentum * 0.55 + city.social_density_score * 0.25 + (city.sea_access ? 8 : 0));
  return {
    sourceLabel: "stored local city pulse",
    confidence: "medium" as const,
    articleCount,
    eventMomentum,
    riskScore,
    demandPressure,
    headlines: [
      `${city.name} travel momentum and seasonal demand watch`,
      `${city.name} nightlife, culture, and international crowd signal`,
      `${city.country} tourism pressure baseline for social travelers`
    ],
    explanation: "Stored local pulse generated from city scores, risk flags, nightlife, social density, and tourism profile. It replaces live GDELT for product runtime; live GDELT remains optional/admin-only."
  };
}
