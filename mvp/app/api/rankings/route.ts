import { ok } from "@/lib/server/api";
import { getAllCityIntelligence, type CityIntelligence, type MonthName } from "@/lib/city-intelligence";
import { passportFit, type PassportProfile } from "@/lib/passport";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity } from "@/lib/scoring";
import type { AvoidKey, FeatureKey, TravelStyle } from "@/lib/types";

export const dynamic = "force-dynamic";

const monthNames: MonthName[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const passportProfiles: PassportProfile[] = ["any", "eu", "uk", "us-canada", "turkish", "visa-flexible"];
const genderModes = ["any", "balanced", "female-leaning", "male-leaning", "nightlife-balanced"] as const;
type GenderMode = typeof genderModes[number];

const allowedStyles: TravelStyle[] = ["balanced", "social", "nightlife", "culture", "food", "budget", "remote-work", "sports"];
const allowedFeatures: FeatureKey[] = ["bars", "clubs", "local_food", "historic", "sea", "international_crowd", "young_adults", "coworking"];
const allowedAvoid: AvoidKey[] = ["too_crowded", "tourist_traps", "expensive", "car_dependent", "dead_nightlife"];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseList<T extends string>(value: string | null, allowed: readonly T[], fallback: T[]): T[] {
  if (!value) return fallback;
  const parsed = value.split(",").map((item) => item.trim()).filter(Boolean).filter((item): item is T => allowed.includes(item as T));
  return parsed.length ? parsed : fallback;
}

function parseMonth(value: string | null): MonthName {
  return monthNames.includes(value as MonthName) ? value as MonthName : "July";
}

function parsePassport(value: string | null): PassportProfile {
  return passportProfiles.includes(value as PassportProfile) ? value as PassportProfile : "any";
}

function parseGender(value: string | null): GenderMode {
  return genderModes.includes(value as GenderMode) ? value as GenderMode : "any";
}

function genderPass(city: CityIntelligence, mode: GenderMode) {
  const night = city.demographics.nightlifeGenderMix;
  if (mode === "any") return true;
  if (mode === "balanced") return city.demographics.genderBalanceScore >= 88;
  if (mode === "female-leaning") return night.female >= 45;
  if (mode === "male-leaning") return night.male >= 54;
  return Math.abs(night.male - night.female) <= 10;
}

function nationalityShare(city: CityIntelligence, nationality: string | null) {
  if (!nationality) return 0;
  return city.demographics.touristNationalityMix.find((item) => item.label.toLowerCase() === nationality.toLowerCase())?.share ?? 0;
}

function makeIntent(input: { budget: number; nights: number; month: MonthName; styles: TravelStyle[]; wanted: FeatureKey[]; avoid: AvoidKey[] }) {
  const intent = defaultIntent();
  intent.budget.per_person_eur = input.budget;
  intent.budget.sensitivity = input.budget <= 800 ? "high" : input.budget <= 1300 ? "medium" : "low";
  intent.dates.month = input.month;
  intent.dates.nights = input.nights;
  intent.travel_style = input.styles.length ? input.styles : ["balanced"];
  Object.keys(intent.desired_features).forEach((key) => { intent.desired_features[key as FeatureKey] = false; });
  input.wanted.forEach((feature) => { intent.desired_features[feature] = true; });
  Object.keys(intent.avoid).forEach((key) => { intent.avoid[key as AvoidKey] = false; });
  input.avoid.forEach((avoid) => { intent.avoid[avoid] = true; });
  return intent;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const month = parseMonth(url.searchParams.get("month"));
  const passport = parsePassport(url.searchParams.get("passport"));
  const gender = parseGender(url.searchParams.get("gender"));
  const nationality = url.searchParams.get("nationality")?.trim() || null;
  const budget = Number(url.searchParams.get("budget") ?? 1000);
  const nights = Number(url.searchParams.get("nights") ?? 14);
  const top = Math.max(1, Math.min(100, Number(url.searchParams.get("top") ?? 25)));
  const country = url.searchParams.get("country")?.trim() || null;
  const continent = url.searchParams.get("continent")?.trim() || null;
  const query = url.searchParams.get("q")?.trim().toLowerCase() || "";
  const styles = parseList(url.searchParams.get("styles"), allowedStyles, ["social", "culture", "food"]);
  const wanted = parseList(url.searchParams.get("features"), allowedFeatures, ["bars", "local_food", "historic", "international_crowd", "young_adults"]);
  const avoid = parseList(url.searchParams.get("avoid"), allowedAvoid, ["car_dependent"]);
  const intent = makeIntent({ budget, nights, month, styles, wanted, avoid });

  const ranked = getAllCityIntelligence()
    .filter((city) => !country || city.country.toLowerCase() === country.toLowerCase())
    .filter((city) => !continent || city.continent.toLowerCase() === continent.toLowerCase())
    .filter((city) => !nationality || nationalityShare(city, nationality) > 0)
    .filter((city) => genderPass(city, gender))
    .filter((city) => !query || `${city.name} ${city.country} ${city.continent} ${city.types.join(" ")} ${city.best_neighborhoods.join(" ")} ${city.demographics.touristNationalityMix.map((item) => item.label).join(" ")}`.toLowerCase().includes(query))
    .map((city) => {
      const base = scoreCity(city, intent);
      const passportResult = passportFit(city, passport);
      const weather = city.monthlyWeather[month];
      const selectedNationalityShare = nationalityShare(city, nationality);
      const storedBoost = (city.pulse.demandPressure - 50) * 0.055 + (city.venues.densityScore - 50) * 0.045 + (city.tourism.cityTourismDemandScore - 50) * 0.045 + (weather.weatherComfort - 50) * 0.04 + selectedNationalityShare * 0.12;
      const genderScore = city.demographics.genderBalanceScore;
      const score = clamp(base.score + storedBoost + passportResult.score * 0.055 + genderScore * 0.035 - 9);
      return {
        id: city.id,
        name: city.name,
        country: city.country,
        continent: city.continent,
        href: `/cities/${city.id}`,
        rankScore: score,
        baseScore: base.score,
        estimatedCost: base.estimatedCost,
        passportScore: passportResult.score,
        passportLabel: passportResult.label,
        genderScore,
        nightlifeGenderMix: city.demographics.nightlifeGenderMix,
        nationalityFilter: nationality,
        nationalityShare: selectedNationalityShare,
        touristNationalityMix: city.demographics.touristNationalityMix,
        weatherComfort: weather.weatherComfort,
        pulseDemand: city.pulse.demandPressure,
        pulseRisk: city.pulse.riskScore,
        venueDensity: city.venues.densityScore,
        bars: city.venues.bars,
        clubs: city.venues.clubs,
        restaurants: city.venues.restaurants,
        cafes: city.venues.cafes,
        tourismDemand: city.tourism.cityTourismDemandScore,
        internationalPressure: city.tourism.internationalTouristPressure,
        flag: city.visuals.flag,
        visualSlides: city.visuals.slides,
        sourceConfidence: city.sourceConfidence
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, top)
    .map((city, index) => ({ rank: index + 1, ...city }));

  return ok({
    status: "stored-ranking",
    input: { month, passport, gender, nationality, budget, nights, top, country, continent, query, styles, features: wanted, avoid },
    totalReturned: ranked.length,
    routes: {
      rankingsPage: "/rankings",
      demographicsPage: "/demographics",
      worldPage: "/",
      auditPage: "/audit",
      functionalityPage: "/functionality"
    },
    cities: ranked
  });
}
