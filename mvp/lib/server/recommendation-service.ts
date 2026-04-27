import { cities as seedCities, places as seedPlaces, events as seedEvents } from "@/lib/seed";
import { worldCities } from "@/lib/world-data";
import { extractIntentLocally } from "@/lib/extraction";
import { scoreCity, scorePlace } from "@/lib/scoring";
import type { City, Intent, Place } from "@/lib/types";
import type { Continent, WorldCity } from "@/lib/world-data";
import { nowIso } from "./api";

function cityWithDefaults(city: City, index = 0) {
  return {
    city,
    index,
    tags: city.types,
    neighborhoods: city.best_neighborhoods,
    riskFlags: city.risk_flags
  };
}

type TemporaryCityInput = {
  intent: Intent;
  city: Partial<City> & {
    id?: string;
    name: string;
    country: string;
    continent?: Continent;
    lat?: number;
    lng?: number;
    types?: string[];
    base_cost_per_person?: number;
    average_daily_cost?: number;
    social_density_score?: number;
    nightlife_score?: number;
    history_score?: number;
    food_culture_score?: number;
    mobility_score?: number;
    sea_access?: boolean;
    best_neighborhoods?: string[];
    risk_flags?: string[];
    notes?: string;
  };
};

export async function extractIntentService(input: {
  text: string;
  groupSize: number;
  ageRange: string;
  budget: number;
  nights: number;
  month: string;
  style: Intent["travel_style"][number];
  useAi?: boolean;
}) {
  const local = extractIntentLocally(input);
  return {
    intent: local,
    source: process.env.OPENAI_API_KEY && input.useAi ? "openai-ready-fallback-local" : "local-deterministic",
    warnings: process.env.OPENAI_API_KEY && input.useAi ? ["OpenAI adapter is gated; local extraction returned until model prompt is explicitly enabled."] : [],
    generatedAt: nowIso()
  };
}

export function recommendCitiesService(input: {
  intent: Intent;
  topN: number;
  continent?: Continent | "All";
  budgetCap?: number;
  seaAccess?: boolean;
  minNightlife?: number;
  minHistory?: number;
  minSocialDensity?: number;
}) {
  let pool: Array<City | WorldCity> = input.continent && input.continent !== "All" ? worldCities.filter((city) => city.continent === input.continent) : [...worldCities, ...seedCities];
  const seen = new Set<string>();
  pool = pool.filter((city) => {
    if (seen.has(city.id)) return false;
    seen.add(city.id);
    return true;
  });

  const ranked = pool
    .map((city, index) => ({ ...cityWithDefaults(city, index), result: scoreCity(city, input.intent) }))
    .filter(({ city, result }) => (input.budgetCap ? result.estimatedCost <= input.budgetCap : true) && (typeof input.seaAccess === "boolean" ? city.sea_access === input.seaAccess : true) && (input.minNightlife ? city.nightlife_score >= input.minNightlife : true) && (input.minHistory ? city.history_score >= input.minHistory : true) && (input.minSocialDensity ? city.social_density_score >= input.minSocialDensity : true))
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, input.topN)
    .map((item, rank) => ({ rank: rank + 1, ...item }));

  return { ranked, count: ranked.length, generatedAt: nowIso(), scoringVersion: "city-score-v1" };
}

export function recommendWorldService(input: {
  intent: Intent;
  topN: number;
  continent: Continent | "All";
  metric: "score" | "cost" | "nightlife" | "history" | "social";
  selectedCityId?: string;
  budgetCap?: number;
}) {
  const rankedGlobal = worldCities
    .map((city) => ({ city, result: scoreCity(city, input.intent) }))
    .filter(({ result }) => (input.budgetCap ? result.estimatedCost <= input.budgetCap : true))
    .sort((a, b) => b.result.score - a.result.score);

  const continentCounters = new Map<string, number>();
  const rankedWithRanks = rankedGlobal.map((item, index) => {
    const continentRank = (continentCounters.get(item.city.continent) ?? 0) + 1;
    continentCounters.set(item.city.continent, continentRank);
    return { ...item, globalRank: index + 1, continentRank };
  });

  const visible = rankedWithRanks.filter((item) => input.continent === "All" || item.city.continent === input.continent).slice(0, input.topN);
  const selected = rankedWithRanks.find((item) => item.city.id === input.selectedCityId) ?? visible[0] ?? rankedWithRanks[0];
  const leaders = Array.from(new Set(worldCities.map((city) => city.continent))).map((continent) => rankedWithRanks.find((item) => item.city.continent === continent)).filter(Boolean);
  const points = visible.map((item) => ({ id: item.city.id, name: item.city.name, country: item.city.country, continent: item.city.continent, lat: item.city.lat, lng: item.city.lng, score: item.result.score, cost: item.result.estimatedCost, globalRank: item.globalRank, continentRank: item.continentRank, markerSize: Math.max(0.18, item.result.score / 210), markerColor: item.city.id === selected?.city.id ? "#bbf7d0" : item.result.score >= 86 ? "#22d3ee" : "#60a5fa" }));
  const arcs = selected ? visible.filter((item) => item.city.id !== selected.city.id).slice(0, 12).map((item) => ({ from: selected.city.id, to: item.city.id, startLat: selected.city.lat, startLng: selected.city.lng, endLat: item.city.lat, endLng: item.city.lng })) : [];

  return { metric: input.metric, topN: input.topN, continent: input.continent, totalCities: worldCities.length, visible, selected, leaders, points, arcs, generatedAt: nowIso(), scoringVersion: "world-score-v1" };
}

export function recommendPlacesService(input: { intent: Intent; cityId?: string; topN: number; placeTypes?: string[]; goodFor?: string[]; maxPriceLevel?: number }) {
  const rankedCities = recommendCitiesService({ intent: input.intent, topN: 200 });
  const cityScores = new Map(rankedCities.ranked.map((item) => [item.city.id, item.result.score]));
  const ranked = seedPlaces
    .filter((place) => (input.cityId ? place.city_id === input.cityId : true))
    .filter((place) => (input.placeTypes?.length ? input.placeTypes.includes(place.type) : true))
    .filter((place) => (input.goodFor?.length ? input.goodFor.some((tag) => place.good_for.includes(tag)) : true))
    .filter((place) => (input.maxPriceLevel ? place.price_level <= input.maxPriceLevel : true))
    .map((place) => ({ place, result: scorePlace(place, input.intent, cityScores.get(place.city_id) ?? 70) }))
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, input.topN)
    .map((item, rank) => ({ rank: rank + 1, ...item }));
  return { ranked, count: ranked.length, generatedAt: nowIso(), scoringVersion: "place-score-v1" };
}

export function scoreTemporaryCityService(input: TemporaryCityInput) {
  const city: City = {
    id: input.city.id ?? `temp_${input.city.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    name: input.city.name,
    country: input.city.country,
    types: input.city.types ?? [],
    base_cost_per_person: input.city.base_cost_per_person ?? 800,
    average_daily_cost: input.city.average_daily_cost ?? 60,
    social_density_score: input.city.social_density_score ?? 75,
    nightlife_score: input.city.nightlife_score ?? 75,
    history_score: input.city.history_score ?? 75,
    food_culture_score: input.city.food_culture_score ?? 75,
    mobility_score: input.city.mobility_score ?? 75,
    sea_access: input.city.sea_access ?? false,
    best_neighborhoods: input.city.best_neighborhoods ?? [],
    risk_flags: input.city.risk_flags ?? [],
    nationality_mix_context: input.city.nationality_mix_context ?? "User-provided temporary city.",
    crowd_pressure_by_month: input.city.crowd_pressure_by_month ?? { July: 70 },
    seasonality_by_month: input.city.seasonality_by_month ?? { July: 75 },
    notes: input.city.notes ?? "Temporary user-estimated city."
  };

  return { city: { ...city, continent: input.city.continent, lat: input.city.lat, lng: input.city.lng }, result: scoreCity(city, input.intent), generatedAt: nowIso(), persisted: false };
}

export function scoreTemporaryPlaceService(input: { intent: Intent; place: Place; cityScore: number }) {
  return { place: input.place, result: scorePlace(input.place, input.intent, input.cityScore), generatedAt: nowIso(), persisted: false };
}

export function generateItineraryService(input: { intent: Intent; cityId: string; placeIds: string[]; eventIds: string[]; intensity: "low" | "balanced" | "high"; days: number }) {
  const city = [...worldCities, ...seedCities].find((item) => item.id === input.cityId) ?? worldCities[0];
  const selectedPlaces = seedPlaces.filter((place) => input.placeIds.includes(place.id) || place.city_id === city.id).slice(0, Math.max(3, input.days));
  const selectedEvents = seedEvents.filter((event) => input.eventIds.includes(event.id) || event.city_id === city.id);
  const route = Array.from({ length: input.days }).map((_, index) => ({
    day: index + 1,
    theme: index === 0 ? "arrival + orientation" : index % 3 === 1 ? "culture + food + social night" : index % 3 === 2 ? "recovery + opt-in networking" : "peak social night",
    blocks: [
      { time: "morning", type: "recovery/mobility", recommendation: index === 0 ? "arrival, check-in, low-friction neighborhood walk" : "slow breakfast and local orientation" },
      { time: "afternoon", type: "culture", recommendation: city.best_neighborhoods[index % city.best_neighborhoods.length] ?? "historic center" },
      { time: "evening", type: "food/place", recommendation: selectedPlaces[index % Math.max(1, selectedPlaces.length)]?.name ?? "local dinner area" },
      { time: "night", type: "social opportunity", recommendation: selectedEvents[index % Math.max(1, selectedEvents.length)]?.name ?? "opt-in bar/event context" }
    ]
  }));
  return { city, intensity: input.intensity, route, generatedAt: nowIso(), safetyNote: "Recommendations are environments and opt-in events, not individual people." };
}
