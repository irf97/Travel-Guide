import { ok } from "@/lib/server/api";
import { worldCities } from "@/lib/world-data";
import { getCityDemographicModel } from "@/lib/city-demographics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country");
  const continent = url.searchParams.get("continent");
  const q = url.searchParams.get("q")?.toLowerCase().trim();

  const cities = worldCities
    .filter((city) => !country || city.country === country)
    .filter((city) => !continent || city.continent === continent)
    .filter((city) => !q || `${city.name} ${city.country} ${city.continent} ${city.types.join(" ")} ${city.best_neighborhoods.join(" ")}`.toLowerCase().includes(q))
    .map((city) => ({ ...city, demographics: getCityDemographicModel(city) }));

  const countries = [...new Set(worldCities.map((city) => city.country))].sort();
  return ok({ status: "fallback-seed", sourceLabel: "Fallback estimate", cities, countries, total: cities.length });
}
