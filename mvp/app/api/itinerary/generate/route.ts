import { NextResponse } from "next/server";
import { cities, events, places } from "@/lib/seed";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity, scorePlace } from "@/lib/scoring";
import { intentSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const intent = intentSchema.safeParse(body.intent).success ? intentSchema.parse(body.intent) : defaultIntent();
  const rankedCity = cities.map((city) => ({ city, score: scoreCity(city, intent).score })).sort((a, b) => b.score - a.score)[0];
  const rankedPlaces = places
    .filter((place) => place.city_id === rankedCity.city.id)
    .map((place) => ({ place, score: scorePlace(place, intent, rankedCity.score).score }))
    .sort((a, b) => b.score - a.score);
  const rankedEvents = events.filter((event) => event.city_id === rankedCity.city.id);

  const route = Array.from({ length: Math.min(intent.dates.nights, 7) }).map((_, index) => ({
    day: index + 1,
    theme: index === 0 ? "arrival + low-pressure social night" : index % 3 === 0 ? "recovery + cultural depth" : "social-context exploration",
    blocks: [
      { time: "morning", type: "recovery/culture", recommendation: rankedCity.city.best_neighborhoods[index % rankedCity.city.best_neighborhoods.length] },
      { time: "afternoon", type: "place", place_id: rankedPlaces[index % Math.max(1, rankedPlaces.length)]?.place.id ?? null },
      { time: "evening", type: "food/social", place_id: rankedPlaces[(index + 1) % Math.max(1, rankedPlaces.length)]?.place.id ?? null },
      { time: "night", type: "opt-in social opportunity", event_id: rankedEvents[index % Math.max(1, rankedEvents.length)]?.id ?? null }
    ],
    notes: "Avoid over-scheduling. Keep one flexible open-loop slot per day."
  }));

  return NextResponse.json({ city: rankedCity.city, route });
}
