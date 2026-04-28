import { ok } from "@/lib/server/api";
import { featureSummary, siteFeatures } from "@/lib/site-features";
import { getAllCityIntelligence } from "@/lib/city-intelligence";

export const dynamic = "force-dynamic";

function auditCity(city: ReturnType<typeof getAllCityIntelligence>[number]) {
  const checks = {
    visuals: Boolean(city.visuals?.slides?.length >= 5),
    pulse: Boolean(city.pulse?.headlines?.length),
    nationalityMix: Boolean(city.demographics?.touristNationalityMix?.length),
    genderMix: Boolean(city.demographics?.nightlifeGenderMix),
    venueCounts: Boolean(city.venues?.bars && city.venues?.clubs && city.venues?.restaurants && city.venues?.cafes),
    identityVenueSplit: Boolean(city.identityVenueCounts?.locals && city.identityVenueCounts?.tourists && city.identityVenueCounts?.students && city.identityVenueCounts?.remoteWorkers),
    monthlyWeather: Boolean(city.monthlyWeather?.January && city.monthlyWeather?.July && city.monthlyWeather?.December),
    tourism: Boolean(city.tourism?.cityTourismDemandScore),
    cityPage: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.values(checks).length;
  return {
    cityId: city.id,
    name: city.name,
    country: city.country,
    complete: passed === total,
    score: Math.round((passed / total) * 100),
    missing: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key)
  };
}

export async function GET() {
  const cities = getAllCityIntelligence();
  const top100 = cities.slice(0, 100).map(auditCity);
  const completeTop100 = top100.filter((city) => city.complete).length;
  const featureStatus = featureSummary();
  return ok({
    status: "ok",
    product: "Social Travel Intelligence OS",
    generatedAt: new Date().toISOString(),
    featureStatus,
    top100Audit: {
      total: top100.length,
      complete: completeTop100,
      incomplete: top100.length - completeTop100,
      averageCompleteness: Math.round(top100.reduce((sum, city) => sum + city.score, 0) / Math.max(1, top100.length))
    },
    links: {
      world: "/",
      rankings: "/rankings",
      city: "/cities/barcelona-spain",
      lab: "/lab",
      portal: "/portal",
      audit: "/audit",
      admin: "/admin",
      functionality: "/functionality",
      auditJson: "/api/audit/top-100",
      cityIntelligence: "/api/city-intelligence?id=barcelona-spain"
    },
    features: siteFeatures,
    top100
  });
}
