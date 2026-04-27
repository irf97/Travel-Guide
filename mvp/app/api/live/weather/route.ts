import { ok } from "@/lib/server/api";
import { fetchOpenMeteoWeather } from "@/lib/server/open-meteo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("lat") ?? url.searchParams.get("latitude"));
  const longitude = Number(url.searchParams.get("lng") ?? url.searchParams.get("longitude"));
  const result = await fetchOpenMeteoWeather({ latitude, longitude });

  if (result.ok) {
    return ok({ status: "live", sourceLabel: "open-live", confidence: "high", weather: result.data });
  }

  return ok({ status: "fallback", sourceLabel: "open-live", confidence: "low", error: result.error, weather: result.fallback });
}
