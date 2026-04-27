import { ok } from "@/lib/server/api";
import { getAllCityIntelligence, getCityIntelligenceById, getCityIntelligenceVersions } from "@/lib/city-intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const country = url.searchParams.get("country");
  const continent = url.searchParams.get("continent");
  const q = url.searchParams.get("q")?.toLowerCase().trim();

  if (id) {
    const city = getCityIntelligenceById(id);
    return ok({ status: city ? "stored-city-intelligence" : "not_found", versions: getCityIntelligenceVersions(), city });
  }

  const cities = getAllCityIntelligence()
    .filter((city) => !country || city.country === country)
    .filter((city) => !continent || city.continent === continent)
    .filter((city) => !q || `${city.name} ${city.country} ${city.continent} ${city.types.join(" ")} ${city.best_neighborhoods.join(" ")}`.toLowerCase().includes(q));

  return ok({ status: "stored-city-intelligence", versions: getCityIntelligenceVersions(), total: cities.length, cities });
}
