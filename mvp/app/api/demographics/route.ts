import { ok } from "@/lib/server/api";
import { getAllCityIntelligence } from "@/lib/city-intelligence";

export const dynamic = "force-dynamic";

function weightedAverage(values: Array<{ value: number; weight: number }>) {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) return 0;
  return Math.round(values.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight);
}

function aggregateNationality(cities: ReturnType<typeof getAllCityIntelligence>) {
  const map = new Map<string, number>();
  for (const city of cities) {
    for (const item of city.demographics.touristNationalityMix) {
      map.set(item.label, (map.get(item.label) ?? 0) + item.share);
    }
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, share: Math.round(value / Math.max(1, cities.length)) }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 12);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country")?.trim() || null;
  const continent = url.searchParams.get("continent")?.trim() || null;
  const minFemaleNightlife = Number(url.searchParams.get("minFemaleNightlife") ?? 0);
  const minGenderBalance = Number(url.searchParams.get("minGenderBalance") ?? 0);
  const top = Math.max(1, Math.min(100, Number(url.searchParams.get("top") ?? 100)));

  const cities = getAllCityIntelligence()
    .filter((city) => !country || city.country.toLowerCase() === country.toLowerCase())
    .filter((city) => !continent || city.continent.toLowerCase() === continent.toLowerCase())
    .filter((city) => city.demographics.nightlifeGenderMix.female >= minFemaleNightlife)
    .filter((city) => city.demographics.genderBalanceScore >= minGenderBalance)
    .slice(0, top);

  const generalGender = {
    male: weightedAverage(cities.map((city) => ({ value: city.demographics.generalGenderMix.male, weight: city.population || 1 }))),
    female: weightedAverage(cities.map((city) => ({ value: city.demographics.generalGenderMix.female, weight: city.population || 1 })))
  };

  const nightlifeGender = {
    male: weightedAverage(cities.map((city) => ({ value: city.demographics.nightlifeGenderMix.male, weight: city.venues.bars + city.venues.clubs + 1 }))),
    female: weightedAverage(cities.map((city) => ({ value: city.demographics.nightlifeGenderMix.female, weight: city.venues.bars + city.venues.clubs + 1 }))),
    unknown: weightedAverage(cities.map((city) => ({ value: city.demographics.nightlifeGenderMix.unknown, weight: city.venues.bars + city.venues.clubs + 1 })))
  };

  return ok({
    status: "stored-demographics",
    input: { country, continent, minFemaleNightlife, minGenderBalance, top },
    totalReturned: cities.length,
    aggregate: {
      generalGender,
      nightlifeGender,
      nationalityMix: aggregateNationality(cities),
      averageGenderBalanceScore: weightedAverage(cities.map((city) => ({ value: city.demographics.genderBalanceScore, weight: 1 }))),
      averageTouristShare: weightedAverage(cities.map((city) => ({ value: city.demographics.touristVisitorShare, weight: 1 }))),
      averageLocalShare: weightedAverage(cities.map((city) => ({ value: city.demographics.localResidentShare, weight: 1 })))
    },
    cities: cities.map((city) => ({
      id: city.id,
      name: city.name,
      country: city.country,
      continent: city.continent,
      href: `/cities/${city.id}`,
      flag: city.visuals.flag,
      genderBalanceScore: city.demographics.genderBalanceScore,
      generalGenderMix: city.demographics.generalGenderMix,
      nightlifeGenderMix: city.demographics.nightlifeGenderMix,
      touristNationalityMix: city.demographics.touristNationalityMix,
      localResidentShare: city.demographics.localResidentShare,
      touristVisitorShare: city.demographics.touristVisitorShare,
      internationalStudentShare: city.demographics.internationalStudentShare,
      confidenceScore: city.demographics.confidenceScore,
      venues: {
        bars: city.venues.bars,
        clubs: city.venues.clubs,
        restaurants: city.venues.restaurants,
        cafes: city.venues.cafes
      },
      sourceConfidence: city.sourceConfidence.demographics
    }))
  });
}
