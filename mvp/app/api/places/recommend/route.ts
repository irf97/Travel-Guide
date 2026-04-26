import { NextResponse } from "next/server";
import { cities, places } from "@/lib/seed";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity, scorePlace } from "@/lib/scoring";
import { intentSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const intent = intentSchema.safeParse(body.intent).success ? intentSchema.parse(body.intent) : defaultIntent();
  const cityScores = new Map(cities.map((city) => [city.id, scoreCity(city, intent).score]));

  const recommendations = places
    .map((place) => ({ place, result: scorePlace(place, intent, cityScores.get(place.city_id) ?? 70) }))
    .sort((a, b) => b.result.score - a.result.score);

  return NextResponse.json({ recommendations, scoring: "transparent-v1" });
}
