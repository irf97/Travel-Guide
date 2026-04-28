import { ok } from "@/lib/server/api";
import { getAllCityIntelligence } from "@/lib/city-intelligence";

export const dynamic = "force-dynamic";

function auditCity(city: ReturnType<typeof getAllCityIntelligence>[number]) {
  const checks = {
    visuals: Boolean(city.visuals?.slides?.length >= 5),
    pulse: Boolean(city.pulse?.headlines?.length),
    nationalityMix: Boolean(city.demographics?.touristNationalityMix?.length),
    genderMix: Boolean(city.demographics?.nightlifeGenderMix),
    venueCounts: Boolean(city.venues?.bars && city.venues?.clubs && city.venues?.restaurants && city.venues?.cafes),
    identityVenueSplit: Boolean(city.identityVenueCounts?.locals && city.identityVenueCounts?.tourists && city.identityVenueCounts?.students && city.identityVenueCounts?.remoteWorkers),
    monthlyWeather: Boolean(city.monthlyWeather?.January && city.monthlyWeather?.July && city.monthlyWeather?.December),
    tourism: Boolean(city.tourism?.cityTourismDemandScore),
    cityPage: true
  };
  const missing = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => key);
  return {
    id: city.id,
    name: city.name,
    country: city.country,
    complete: missing.length === 0,
    completenessScore: Math.round((Object.values(checks).filter(Boolean).length / Object.values(checks).length) * 100),
    missing,
    checks
  };
}

export async function GET() {
  const cities = getAllCityIntelligence().slice(0, 100).map(auditCity);
  const complete = cities.filter((city) => city.complete).length;
  const incomplete = cities.filter((city) => !city.complete);
  return ok({
    status: complete === 100 ? "complete" : "needs_review",
    total: cities.length,
    complete,
    incomplete: incomplete.length,
    averageCompleteness: Math.round(cities.reduce((sum, city) => sum + city.completenessScore, 0) / Math.max(1, cities.length)),
    cities
  });
}
