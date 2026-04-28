import { ok } from "@/lib/server/api";
import { getCityIntelligenceById, type MonthName } from "@/lib/city-intelligence";
import { passportFit, type PassportProfile } from "@/lib/passport";

export const dynamic = "force-dynamic";

const months: MonthName[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const passports: PassportProfile[] = ["any", "eu", "uk", "us-canada", "turkish", "visa-flexible"];
const identities = ["locals", "tourists", "students", "remoteWorkers"] as const;
type Identity = typeof identities[number];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseMonth(value: string | null): MonthName {
  return months.includes(value as MonthName) ? value as MonthName : "July";
}

function parsePassport(value: string | null): PassportProfile {
  return passports.includes(value as PassportProfile) ? value as PassportProfile : "any";
}

function parseIdentity(value: string | null): Identity {
  return identities.includes(value as Identity) ? value as Identity : "tourists";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "barcelona-spain";
  const city = getCityIntelligenceById(id);
  if (!city) {
    return ok({ status: "not_found", message: `City not found: ${id}` }, { status: 404 });
  }

  const month = parseMonth(url.searchParams.get("month"));
  const passport = parsePassport(url.searchParams.get("passport"));
  const identity = parseIdentity(url.searchParams.get("identity"));
  const nights = Math.max(1, Math.min(60, Number(url.searchParams.get("nights") ?? 5)));
  const budget = Math.max(100, Math.min(10000, Number(url.searchParams.get("budget") ?? 700)));
  const weather = city.monthlyWeather[month];
  const passportResult = passportFit(city, passport);
  const estimatedCost = Math.round(city.average_daily_cost * nights);
  const budgetFit = clamp(100 - Math.max(0, estimatedCost - budget) / 8);
  const identityVenues = city.identityVenueCounts[identity];
  const morning = weather.weatherComfort >= 75 ? city.visuals.nature : city.visuals.architecture;
  const evening = identity === "students" ? "student-heavy social route" : identity === "locals" ? "local bar/cafe route" : identity === "remoteWorkers" ? "coworking-to-cafe route" : "tourist/international social route";
  const nightlifeMode = weather.outdoorNightlifeScore >= 80 ? "outdoor nightlife first" : "indoor bars and late cafes first";
  const matchScore = clamp(
    weather.weatherComfort * 0.22 +
    weather.outdoorNightlifeScore * 0.2 +
    city.pulse.demandPressure * 0.16 +
    city.venues.densityScore * 0.16 +
    city.demographics.genderBalanceScore * 0.1 +
    passportResult.score * 0.1 +
    budgetFit * 0.06
  );

  return ok({
    status: "stored-city-plan",
    input: { id, month, passport, identity, nights, budget },
    city: {
      id: city.id,
      name: city.name,
      country: city.country,
      href: `/cities/${city.id}`,
      flag: city.visuals.flag
    },
    matchScore,
    estimatedCost,
    budgetFit,
    passportFit: passportResult,
    weather: {
      avgTempC: weather.avgTempC,
      rainDays: weather.rainDays,
      comfort: weather.weatherComfort,
      outdoorNightlife: weather.outdoorNightlifeScore
    },
    pulse: city.pulse,
    identityVenueCounts: identityVenues,
    plan: [
      { label: "Morning", action: morning, score: weather.weatherComfort },
      { label: "Afternoon", action: `${city.visuals.architecture} + ${city.venues.restaurants} restaurant-surface estimate`, score: city.history_score },
      { label: "Evening", action: `${evening}: ${identityVenues.cafes} cafes, ${identityVenues.restaurants} restaurants`, score: city.social_density_score },
      { label: "Night", action: `${nightlifeMode}: ${identityVenues.bars} bars, ${identityVenues.clubs} clubs`, score: weather.outdoorNightlifeScore }
    ],
    sourceConfidence: city.sourceConfidence
  });
}
