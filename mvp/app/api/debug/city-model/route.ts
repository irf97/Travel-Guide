import { getAllCityIntelligence } from "@/lib/city-intelligence";
import { ok } from "@/lib/server/api";

export const dynamic = "force-dynamic";

function keysOf(value: unknown) {
  if (!value || typeof value !== "object") return [];
  return Object.keys(value as Record<string, unknown>).sort();
}

export async function GET() {
  const cities = getAllCityIntelligence();
  const sample = cities[0];
  return ok({
    status: "ok",
    totalCities: cities.length,
    sampleCity: sample ? {
      id: sample.id,
      name: sample.name,
      topLevelKeys: keysOf(sample),
      demographicsKeys: keysOf(sample.demographics),
      venueKeys: keysOf(sample.venues),
      tourismKeys: keysOf(sample.tourism),
      pulseKeys: keysOf(sample.pulse),
      visualsKeys: keysOf(sample.visuals),
      sourceConfidenceKeys: keysOf(sample.sourceConfidence),
      monthlyWeatherMonths: keysOf(sample.monthlyWeather),
      identityVenueKeys: keysOf(sample.identityVenueCounts)
    } : null,
    safeModelNotes: [
      "Use demographics.internationalCrowdScore, not internationalStudentShare.",
      "CityIntelligence currently has no population field.",
      "Use lib/demographics-view.ts for normalized demographic responses."
    ]
  });
}
