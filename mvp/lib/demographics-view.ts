import type { CityIntelligence } from "@/lib/city-intelligence";

export type DemographicsView = {
  cityId: string;
  cityName: string;
  country: string;
  continent: string;
  href: string;
  flag: string;
  genderBalanceScore: number;
  generalGenderMix: CityIntelligence["demographics"]["generalGenderMix"];
  nightlifeGenderMix: CityIntelligence["demographics"]["nightlifeGenderMix"];
  nationalityMix: CityIntelligence["demographics"]["nationalityMix"];
  touristNationalityMix: CityIntelligence["demographics"]["touristNationalityMix"];
  localResidentShare: number;
  touristVisitorShare: number;
  internationalCrowdScore: number;
  confidenceScore: number;
  venueCounts: {
    bars: number;
    clubs: number;
    restaurants: number;
    cafes: number;
  };
  sourceConfidence: string;
};

export function getNationalityShare(city: CityIntelligence, nationality: string | null | undefined) {
  if (!nationality || nationality === "All") return 0;
  return city.demographics.touristNationalityMix.find((item) => item.label.toLowerCase() === nationality.toLowerCase())?.share ?? 0;
}

export function toDemographicsView(city: CityIntelligence): DemographicsView {
  return {
    cityId: city.id,
    cityName: city.name,
    country: city.country,
    continent: city.continent,
    href: `/cities/${city.id}`,
    flag: city.visuals.flag,
    genderBalanceScore: city.demographics.genderBalanceScore,
    generalGenderMix: city.demographics.generalGenderMix,
    nightlifeGenderMix: city.demographics.nightlifeGenderMix,
    nationalityMix: city.demographics.nationalityMix,
    touristNationalityMix: city.demographics.touristNationalityMix,
    localResidentShare: city.demographics.localResidentShare,
    touristVisitorShare: city.demographics.touristVisitorShare,
    internationalCrowdScore: city.demographics.internationalCrowdScore,
    confidenceScore: city.demographics.confidenceScore,
    venueCounts: {
      bars: city.venues.bars,
      clubs: city.venues.clubs,
      restaurants: city.venues.restaurants,
      cafes: city.venues.cafes
    },
    sourceConfidence: city.sourceConfidence.demographics
  };
}

export function weightedAverage(values: Array<{ value: number; weight?: number }>) {
  const totalWeight = values.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  if (!totalWeight) return 0;
  return Math.round(values.reduce((sum, item) => sum + item.value * (item.weight ?? 1), 0) / totalWeight);
}

export function aggregateTouristNationalities(cities: CityIntelligence[]) {
  const map = new Map<string, number>();
  for (const city of cities) {
    for (const item of city.demographics.touristNationalityMix) {
      map.set(item.label, (map.get(item.label) ?? 0) + item.share);
    }
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, share: Math.round(value / Math.max(1, cities.length)) }))
    .sort((a, b) => b.share - a.share);
}
