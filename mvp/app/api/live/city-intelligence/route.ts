import { ok } from "@/lib/server/api";
import { fetchOpenMeteoWeather } from "@/lib/server/open-meteo";
import { fetchGdeltCityPulse } from "@/lib/server/gdelt";

export const dynamic = "force-dynamic";

function modeledVenueDensity(input: { nightlifeScore: number; foodScore: number; socialScore: number }) {
  const bars = Math.max(12, Math.round(input.nightlifeScore * 1.8));
  const restaurants = Math.max(25, Math.round(input.foodScore * 2.4));
  const clubs = Math.max(4, Math.round(input.nightlifeScore / 7));
  const socialSurfaceArea = Math.round((bars * 0.35 + restaurants * 0.25 + clubs * 1.8 + input.socialScore) / 2.2);
  return { bars, restaurants, clubs, socialSurfaceArea, source: "modeled from seed scores", confidence: "low" };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city") ?? "";
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const nightlifeScore = Number(url.searchParams.get("nightlifeScore") ?? 70);
  const foodScore = Number(url.searchParams.get("foodScore") ?? 70);
  const socialScore = Number(url.searchParams.get("socialScore") ?? 70);

  const [weatherResult, pulseResult] = await Promise.all([
    fetchOpenMeteoWeather({ latitude: lat, longitude: lng }),
    fetchGdeltCityPulse(city)
  ]);

  const weather = weatherResult.ok ? weatherResult.data : weatherResult.fallback;
  const pulse = pulseResult.ok ? pulseResult.data : pulseResult.fallback;
  const venueDensity = modeledVenueDensity({ nightlifeScore, foodScore, socialScore });
  const outdoorNightlifeScore = Math.round((weather.comfortScore * 0.45 + nightlifeScore * 0.4 + socialScore * 0.15));
  const tourismDemandProxy = Math.round((pulse.demandPressureScore * 0.45 + venueDensity.socialSurfaceArea * 0.35 + socialScore * 0.2));

  return ok({
    status: weatherResult.ok || pulseResult.ok ? "live-partial" : "fallback",
    city,
    weather,
    pulse,
    venueDensity,
    derived: {
      outdoorNightlifeScore,
      tourismDemandProxy,
      source: "Open-Meteo + GDELT + modeled seed scores",
      confidence: pulse.confidence === "medium" && weatherResult.ok ? "medium" : "low"
    }
  });
}
