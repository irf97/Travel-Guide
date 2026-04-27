import { ok } from "@/lib/server/api";
import { worldCities } from "@/lib/world-data";
import { getCityTourismModel, getStoredTourismSnapshot } from "@/lib/tourism-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country");
  const cityId = url.searchParams.get("cityId");
  const snapshot = getStoredTourismSnapshot();
  const cities = worldCities
    .filter((city) => !country || city.country === country)
    .filter((city) => !cityId || city.id === cityId)
    .map((city) => ({ cityId: city.id, city: city.name, country: city.country, tourism: getCityTourismModel(city) }));

  return ok({
    status: snapshot.status,
    source: snapshot.source,
    release: snapshot.version,
    lastDownloadedAt: snapshot.last_downloaded_at,
    eu2024: snapshot.eu_2024,
    countries: snapshot.countries,
    cities
  });
}
