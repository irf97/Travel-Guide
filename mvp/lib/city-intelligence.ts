import climateBaselines from "@/data/weather/monthly-climate-baselines.json";
import venueBaselines from "@/data/venues/venue-density-baselines.json";
import { getCityDemographicModel } from "./city-demographics";
import { getStoredCityPulse } from "./city-pulse-data";
import { getCityTourismModel } from "./tourism-data";
import { getCityVisuals } from "./city-visuals";
import { worldCities, type WorldCity } from "./world-data";

export type MonthName = "January" | "February" | "March" | "April" | "May" | "June" | "July" | "August" | "September" | "October" | "November" | "December";

export type StoredMonthlyWeather = {
  month: MonthName;
  avgTempC: number;
  rainDays: number;
  sunshineScore: number;
  weatherComfort: number;
  outdoorNightlifeScore: number;
  beachComfortScore: number;
  sourceLabel: string;
  confidence: "medium";
};

export type StoredVenueDensity = {
  bars: number;
  clubs: number;
  restaurants: number;
  cafes: number;
  museums: number;
  historicSites: number;
  gyms: number;
  coworking: number;
  densityScore: number;
  socialSurfaceArea: number;
  sourceLabel: string;
  confidence: "low" | "medium";
};

export type IdentityVenueCounts = {
  locals: Pick<StoredVenueDensity, "bars" | "clubs" | "restaurants" | "cafes">;
  tourists: Pick<StoredVenueDensity, "bars" | "clubs" | "restaurants" | "cafes">;
  students: Pick<StoredVenueDensity, "bars" | "clubs" | "restaurants" | "cafes">;
  remoteWorkers: Pick<StoredVenueDensity, "bars" | "clubs" | "restaurants" | "cafes">;
  note: string;
};

export type CityIntelligence = WorldCity & {
  monthlyWeather: Record<MonthName, StoredMonthlyWeather>;
  venues: StoredVenueDensity;
  identityVenueCounts: IdentityVenueCounts;
  visuals: ReturnType<typeof getCityVisuals>;
  pulse: ReturnType<typeof getStoredCityPulse>;
  demographics: ReturnType<typeof getCityDemographicModel>;
  tourism: ReturnType<typeof getCityTourismModel>;
  sourceConfidence: {
    weather: string;
    venues: string;
    tourism: string;
    demographics: string;
    pulse: string;
    visuals: string;
    updatedAt: string;
  };
};

type ClimateProfile = keyof typeof climateBaselines.profiles;

const months = climateBaselines.months as MonthName[];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function profileForCity(city: WorldCity): ClimateProfile {
  if (["Bangkok", "Phuket", "Bali", "Singapore", "Kuala Lumpur", "Penang", "Ho Chi Minh City", "Hanoi", "Da Nang", "Manila", "Cebu", "Colombo", "Zanzibar", "Mauritius", "Seychelles", "Fiji", "Bora Bora"].includes(city.name)) return "tropical";
  if (["Dubai", "Marrakech", "Cairo", "Alexandria", "Tunis", "Jaipur", "Goa", "Mumbai"].includes(city.name)) return "hot_desert";
  if (city.continent === "Oceania" || ["Cape Town", "Buenos Aires", "Rio de Janeiro", "São Paulo", "Florianópolis", "Santiago", "Valparaíso", "Montevideo", "Punta del Este"].includes(city.name)) return "southern_temperate";
  if (["Amsterdam", "London", "Dublin", "Copenhagen", "Stockholm", "Paris", "Berlin", "Seattle", "Vancouver", "Toronto", "Montreal", "San Francisco", "Wellington", "Auckland"].includes(city.name)) return city.lat > 55 ? "cold_oceanic" : "oceanic";
  if (["Prague", "Budapest", "Vienna", "Krakow", "Warsaw", "Ljubljana", "Chicago", "New York", "Seoul", "Tokyo", "Osaka"].includes(city.name)) return "continental";
  if (["Miami", "Austin", "New Orleans", "Hong Kong", "Taipei", "Busan", "Tel Aviv", "Los Angeles", "San Diego", "Honolulu", "Mexico City", "Medellín", "Bogotá", "Lima", "Quito", "Guayaquil"].includes(city.name)) return "subtropical";
  return city.sea_access || city.continent === "Europe" ? "mediterranean" : "continental";
}

function comfortFromTempRainSun(temp: number, rainDays: number, sunshine: number) {
  const tempComfort = 100 - Math.abs(temp - 23) * 4.2;
  const rainPenalty = rainDays * 2.2;
  return clamp(tempComfort * 0.62 + sunshine * 0.33 - rainPenalty);
}

function monthlyWeatherForCity(city: WorldCity): Record<MonthName, StoredMonthlyWeather> {
  const profile = climateBaselines.profiles[profileForCity(city)];
  return Object.fromEntries(months.map((month, index) => {
    const avgTempC = profile.avgTempC[index] ?? 20;
    const rainDays = profile.rainDays[index] ?? 8;
    const sunshineScore = profile.sunshineScore[index] ?? 70;
    const weatherComfort = comfortFromTempRainSun(avgTempC, rainDays, sunshineScore);
    const outdoorNightlifeScore = clamp(weatherComfort * 0.48 + city.nightlife_score * 0.34 + city.social_density_score * 0.18);
    const beachComfortScore = city.sea_access ? clamp(weatherComfort * 0.65 + sunshineScore * 0.35) : clamp(weatherComfort * 0.35);
    return [month, { month, avgTempC, rainDays, sunshineScore, weatherComfort, outdoorNightlifeScore, beachComfortScore, sourceLabel: "stored monthly climate average", confidence: "medium" as const }];
  })) as Record<MonthName, StoredMonthlyWeather>;
}

function venueDensityForCity(city: WorldCity): StoredVenueDensity {
  const base = venueBaselines.basePerScorePoint;
  const multiplier = venueBaselines.continentMultipliers[city.continent] ?? 1;
  const nightlifeBoost = city.types.includes("nightlife") ? 1.18 : 1;
  const seaBoost = city.sea_access ? 1.06 : 1;
  const bars = Math.max(6, Math.round(city.nightlife_score * base.bars * multiplier * nightlifeBoost));
  const clubs = Math.max(1, Math.round(city.nightlife_score * base.clubs * multiplier * nightlifeBoost));
  const restaurants = Math.max(14, Math.round(city.food_culture_score * base.restaurants * multiplier));
  const cafes = Math.max(8, Math.round(city.social_density_score * base.cafes * multiplier));
  const museums = Math.max(1, Math.round(city.history_score * base.museums * multiplier));
  const historicSites = Math.max(1, Math.round(city.history_score * base.historicSites * multiplier));
  const gyms = Math.max(2, Math.round(city.social_density_score * base.gyms * multiplier));
  const coworking = Math.max(1, Math.round(city.mobility_score * base.coworking * multiplier));
  const socialSurfaceArea = clamp((bars * 0.16 + clubs * 1.9 + restaurants * 0.08 + cafes * 0.13 + coworking * 1.2) * seaBoost);
  const densityScore = clamp(city.nightlife_score * 0.28 + city.social_density_score * 0.28 + city.food_culture_score * 0.18 + socialSurfaceArea * 0.26);
  return { bars, clubs, restaurants, cafes, museums, historicSites, gyms, coworking, densityScore, socialSurfaceArea, sourceLabel: "stored venue-density baseline", confidence: "low" };
}

function splitVenueCounts(venues: StoredVenueDensity, demographics: ReturnType<typeof getCityDemographicModel>): IdentityVenueCounts {
  const touristShare = demographics.touristVisitorShare / 100;
  const localShare = demographics.localResidentShare / 100;
  const studentShare = Math.min(0.18, Math.max(0.04, demographics.internationalCrowdScore / 700));
  const remoteShare = Math.min(0.12, Math.max(0.02, venues.coworking / 140));
  const split = (value: number, share: number) => Math.max(1, Math.round(value * share));
  const pick = (share: number) => ({ bars: split(venues.bars, share), clubs: split(venues.clubs, share), restaurants: split(venues.restaurants, share), cafes: split(venues.cafes, share) });
  return {
    locals: pick(localShare),
    tourists: pick(touristShare),
    students: pick(studentShare),
    remoteWorkers: pick(remoteShare),
    note: "Identity split is a stored deterministic estimate. Replace with verified OSM/Overture/FSQ + mobility/tourism data when available."
  };
}

export function buildCityIntelligence(city: WorldCity): CityIntelligence {
  const venues = venueDensityForCity(city);
  const demographics = getCityDemographicModel(city);
  return {
    ...city,
    monthlyWeather: monthlyWeatherForCity(city),
    venues,
    identityVenueCounts: splitVenueCounts(venues, demographics),
    visuals: getCityVisuals(city),
    pulse: getStoredCityPulse(city),
    demographics,
    tourism: getCityTourismModel(city),
    sourceConfidence: {
      weather: "stored monthly climate average",
      venues: "stored venue-density baseline; replaceable by OSM/Overture/FSQ snapshot",
      tourism: "stored downloadable Eurostat snapshot",
      demographics: "stored deterministic model estimate",
      pulse: "stored local pulse for top-city runtime",
      visuals: "stored local visual metadata; image URLs can be added later",
      updatedAt: "2026-04-27"
    }
  };
}

export function getAllCityIntelligence() {
  return worldCities.map(buildCityIntelligence);
}

export function getCityIntelligenceById(id: string) {
  const city = worldCities.find((item) => item.id === id);
  return city ? buildCityIntelligence(city) : null;
}

export function getCityIntelligenceVersions() {
  return {
    climate: climateBaselines.version,
    venues: venueBaselines.version
  };
}
