import { getAllCityIntelligence } from "@/lib/city-intelligence";
import { aggregateTouristNationalities, toDemographicsView, weightedAverage } from "@/lib/demographics-view";
import { ok } from "@/lib/server/api";

export const dynamic = "force-dynamic";

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
    male: weightedAverage(cities.map((city) => ({ value: city.demographics.generalGenderMix.male }))),
    female: weightedAverage(cities.map((city) => ({ value: city.demographics.generalGenderMix.female })))
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
      nationalityMix: aggregateTouristNationalities(cities).slice(0, 12),
      averageGenderBalanceScore: weightedAverage(cities.map((city) => ({ value: city.demographics.genderBalanceScore }))),
      averageTouristShare: weightedAverage(cities.map((city) => ({ value: city.demographics.touristVisitorShare }))),
      averageLocalShare: weightedAverage(cities.map((city) => ({ value: city.demographics.localResidentShare }))),
      averageInternationalCrowdScore: weightedAverage(cities.map((city) => ({ value: city.demographics.internationalCrowdScore })))
    },
    cities: cities.map(toDemographicsView)
  });
}
