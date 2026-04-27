import { ok } from "@/lib/server/api";
import { fetchGdeltCityPulse } from "@/lib/server/gdelt";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city") ?? "";
  const result = await fetchGdeltCityPulse(city);
  if (result.ok) return ok({ status: "live", sourceLabel: "open-live", pulse: result.data });
  return ok({ status: "fallback", sourceLabel: "modeled", error: result.error, pulse: result.fallback });
}
