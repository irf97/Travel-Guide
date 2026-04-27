import type { WorldCity } from "./world-data";

export type NationalityMix = {
  label: string;
  share: number;
  type: "local" | "regional" | "international" | "student" | "remote-worker";
};

export type GenderMix = {
  male: number;
  female: number;
  unknown: number;
  confidence: "low" | "medium";
  note: string;
};

export type CityDemographicModel = {
  cityId: string;
  localResidentShare: number;
  touristVisitorShare: number;
  nationalityMix: NationalityMix[];
  touristNationalityMix: NationalityMix[];
  nightlifeGenderMix: GenderMix;
  generalGenderMix: GenderMix;
  internationalCrowdScore: number;
  genderBalanceScore: number;
  sourceLabel: "Fallback estimate" | "Open-data model";
  confidenceScore: number;
  note: string;
};

const westernEurope = new Set(["Spain", "Portugal", "Italy", "France", "Netherlands", "Germany", "Austria", "Denmark", "Sweden", "Ireland", "United Kingdom"]);
const balkanMed = new Set(["Greece", "Croatia", "Türkiye", "Slovenia"]);
const northAmerica = new Set(["United States", "Canada", "Mexico", "Puerto Rico", "Costa Rica", "Panama", "Cuba"]);
const asiaGateway = new Set(["Thailand", "Japan", "South Korea", "Taiwan", "Singapore", "Malaysia", "Indonesia", "Vietnam", "Hong Kong", "UAE"]);

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeMix(items: NationalityMix[]): NationalityMix[] {
  const total = items.reduce((sum, item) => sum + item.share, 0) || 1;
  return items.map((item) => ({ ...item, share: Math.round((item.share / total) * 100) }));
}

function genderBalanceScore(mix: GenderMix) {
  return clamp(100 - Math.abs(mix.male - mix.female) * 2);
}

export function getCityDemographicModel(city: WorldCity): CityDemographicModel {
  const isPremium = city.base_cost_per_person > 1150;
  const isBudget = city.base_cost_per_person < 700;
  const isNightlife = city.nightlife_score >= 84;
  const isInternational = city.social_density_score >= 86 || city.types.includes("nightlife");
  const touristVisitorShare = clamp((city.sea_access ? 26 : 16) + (isPremium ? 8 : 0) + (isNightlife ? 6 : 0) + (city.history_score > 90 ? 5 : 0));
  const localResidentShare = 100 - touristVisitorShare;

  let nationalityMix: NationalityMix[] = [
    { label: city.country, share: localResidentShare, type: "local" },
    { label: "Regional visitors", share: Math.round(touristVisitorShare * 0.28), type: "regional" },
    { label: "International travelers", share: Math.round(touristVisitorShare * 0.38), type: "international" },
    { label: "Students / Erasmus", share: isInternational ? 9 : 4, type: "student" },
    { label: "Remote workers", share: city.mobility_score > 82 ? 7 : 3, type: "remote-worker" }
  ];

  let touristNationalityMix: NationalityMix[];
  if (westernEurope.has(city.country)) {
    touristNationalityMix = [
      { label: "UK / Ireland", share: 19, type: "international" },
      { label: "Germany / Netherlands", share: 18, type: "international" },
      { label: "France / Belgium", share: 13, type: "international" },
      { label: "Nordics", share: 8, type: "international" },
      { label: "US / Canada", share: 12, type: "international" },
      { label: "Other Europe", share: 20, type: "regional" },
      { label: "Rest of world", share: 10, type: "international" }
    ];
  } else if (balkanMed.has(city.country)) {
    touristNationalityMix = [
      { label: "Germany / Austria / Switzerland", share: 18, type: "international" },
      { label: "UK / Ireland", share: 14, type: "international" },
      { label: "Balkans / nearby region", share: 20, type: "regional" },
      { label: "France / Benelux", share: 10, type: "international" },
      { label: "Nordics", share: 8, type: "international" },
      { label: "US / Canada", share: 10, type: "international" },
      { label: "Rest of world", share: 20, type: "international" }
    ];
  } else if (northAmerica.has(city.country)) {
    touristNationalityMix = [
      { label: "Domestic", share: 44, type: "local" },
      { label: "US / Canada", share: 18, type: "regional" },
      { label: "Latin America", share: 16, type: "regional" },
      { label: "Europe", share: 12, type: "international" },
      { label: "Asia-Pacific", share: 6, type: "international" },
      { label: "Rest of world", share: 4, type: "international" }
    ];
  } else if (asiaGateway.has(city.country)) {
    touristNationalityMix = [
      { label: "Regional Asia", share: 35, type: "regional" },
      { label: "Europe", share: 18, type: "international" },
      { label: "US / Canada", share: 12, type: "international" },
      { label: "Australia / NZ", share: 10, type: "international" },
      { label: "Middle East", share: 8, type: "international" },
      { label: "Rest of world", share: 17, type: "international" }
    ];
  } else {
    touristNationalityMix = [
      { label: "Domestic / local region", share: 36, type: "regional" },
      { label: "Europe", share: 18, type: "international" },
      { label: "US / Canada", share: 12, type: "international" },
      { label: "Nearby countries", share: 18, type: "regional" },
      { label: "Rest of world", share: 16, type: "international" }
    ];
  }

  nationalityMix = normalizeMix(nationalityMix);
  touristNationalityMix = normalizeMix(touristNationalityMix);

  const generalGenderMix: GenderMix = {
    male: isBudget ? 52 : 50,
    female: isBudget ? 46 : 48,
    unknown: 2,
    confidence: "low",
    note: "Modeled resident/visitor balance. Replace with official or commercial mobility/tourism data when available."
  };
  const nightlifeGenderMix: GenderMix = {
    male: isNightlife ? (isPremium ? 53 : 55) : 52,
    female: isNightlife ? (isPremium ? 45 : 43) : 46,
    unknown: 2,
    confidence: "low",
    note: "Modeled nightlife-social scene estimate, not official gender data."
  };

  return {
    cityId: city.id,
    localResidentShare,
    touristVisitorShare,
    nationalityMix,
    touristNationalityMix,
    nightlifeGenderMix,
    generalGenderMix,
    internationalCrowdScore: clamp(city.social_density_score * 0.68 + touristVisitorShare * 0.32),
    genderBalanceScore: genderBalanceScore(nightlifeGenderMix),
    sourceLabel: "Fallback estimate",
    confidenceScore: 42,
    note: "Nationality and gender splits are model estimates derived from city type, cost, seasonality, nightlife, mobility, and region. They are exposed honestly as fallback estimates until official/commercial data is ingested."
  };
}

export function enrichCityWithDemographics(city: WorldCity) {
  return { ...city, demographics: getCityDemographicModel(city) };
}
