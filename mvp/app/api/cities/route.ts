import { ok } from "@/lib/server/api";
import { getAllCityIntelligence, getCityIntelligenceVersions } from "@/lib/city-intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country");
  const continent = url.searchParams.get("continent");
  const q = url.searchParams.get("q")?.toLowerCase().trim();
  const month = url.searchParams.get("month") ?? "July";
  const allCities = getAllCityIntelligence();

  const cities = allCities
    .filter((city) => !country || city.country === country)
    .filter((city) => !continent || city.continent === continent)
    .filter((city) => !q || `${city.name} ${city.country} ${city.continent} ${city.types.join(" ")} ${city.best_neighborhoods.join(" ")}`.toLowerCase().includes(q));

  const countries = [...new Set(allCities.map((city) => city.country))].sort();
  return ok({
    status: "stored-city-intelligence",
    sourceLabel: "Stored city intelligence layer",
    versions: getCityIntelligenceVersions(),
    month,
    cities,
    countries,
    total: cities.length
  });
}
