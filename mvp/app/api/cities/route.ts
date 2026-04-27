import { ok } from "@/lib/server/api";
import { worldCities } from "@/lib/world-data";
import { getCityDemographicModel } from "@/lib/city-demographics";
import { getCityTourismModel, getStoredTourismSnapshot } from "@/lib/tourism-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country");
  const continent = url.searchParams.get("continent");
  const q = url.searchParams.get("q")?.toLowerCase().trim();
  const snapshot = getStoredTourismSnapshot();

  const cities = worldCities
    .filter((city) => !country || city.country === country)
    .filter((city) => !continent || city.continent === continent)
    .filter((city) => !q || `${city.name} ${city.country} ${city.continent} ${city.types.join(" ")} ${city.best_neighborhoods.join(" ")}`.toLowerCase().includes(q))
    .map((city) => ({ ...city, demographics: getCityDemographicModel(city), tourism: getCityTourismModel(city) }));

  const countries = [...new Set(worldCities.map((city) => city.country))].sort();
  return ok({ status: snapshot.status, sourceLabel: "Stored downloadable tourism snapshot", tourismRelease: snapshot.version, cities, countries, total: cities.length });
}
