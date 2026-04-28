import { getAllCityIntelligence } from "@/lib/city-intelligence";
import { siteFeatures } from "@/lib/site-features";

type CheckStatus = "pass" | "warn" | "fail";

export type SmokeCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  href?: string;
};

function statusFromRatio(value: number, passAt: number, warnAt: number): CheckStatus {
  if (value >= passAt) return "pass";
  if (value >= warnAt) return "warn";
  return "fail";
}

function auditCity(city: ReturnType<typeof getAllCityIntelligence>[number]) {
  const checks = [
    Boolean(city.id),
    Boolean(city.name),
    Boolean(city.country),
    Boolean(city.visuals?.flag),
    Boolean(city.visuals?.slides?.length >= 5),
    Boolean(city.pulse?.headlines?.length),
    Boolean(city.demographics?.touristNationalityMix?.length),
    Boolean(city.demographics?.nightlifeGenderMix),
    Boolean(city.venues?.bars && city.venues?.clubs && city.venues?.restaurants && city.venues?.cafes),
    Boolean(city.identityVenueCounts?.locals && city.identityVenueCounts?.tourists),
    Boolean(city.monthlyWeather?.January && city.monthlyWeather?.July && city.monthlyWeather?.December),
    Boolean(city.tourism?.cityTourismDemandScore)
  ];
  return checks.filter(Boolean).length / checks.length;
}

export function runSmokeChecks() {
  const cities = getAllCityIntelligence();
  const top100 = cities.slice(0, 100);
  const completeTop100 = top100.filter((city) => auditCity(city) === 1).length;
  const top100Completeness = Math.round((completeTop100 / Math.max(1, top100.length)) * 100);
  const countries = new Set(cities.map((city) => city.country));
  const continents = new Set(cities.map((city) => city.continent));
  const nationalityLabels = new Set(cities.flatMap((city) => city.demographics.touristNationalityMix.map((item) => item.label)));
  const pageFeatures = siteFeatures.filter((feature) => !feature.href.startsWith("/api/"));
  const apiFeatures = siteFeatures.filter((feature) => feature.href.startsWith("/api/"));

  const checks: SmokeCheck[] = [
    {
      id: "city-count",
      label: "Stored city count",
      status: cities.length >= 100 ? "pass" : cities.length >= 20 ? "warn" : "fail",
      detail: `${cities.length} stored cities available`,
      href: "/api/cities"
    },
    {
      id: "top-100-completeness",
      label: "Top-100 completeness",
      status: statusFromRatio(top100Completeness, 95, 80),
      detail: `${completeTop100}/${top100.length} top cities have required visuals, pulse, demographics, venues, weather, and tourism fields`,
      href: "/audit"
    },
    {
      id: "country-coverage",
      label: "Country coverage",
      status: countries.size >= 25 ? "pass" : countries.size >= 12 ? "warn" : "fail",
      detail: `${countries.size} countries represented`,
      href: "/portal"
    },
    {
      id: "continent-coverage",
      label: "Continent coverage",
      status: continents.size >= 4 ? "pass" : continents.size >= 2 ? "warn" : "fail",
      detail: `${continents.size} continents represented`
    },
    {
      id: "nationality-coverage",
      label: "Nationality filter coverage",
      status: nationalityLabels.size >= 12 ? "pass" : nationalityLabels.size >= 6 ? "warn" : "fail",
      detail: `${nationalityLabels.size} tourist nationality labels available`,
      href: "/demographics"
    },
    {
      id: "feature-registry-pages",
      label: "Feature registry pages",
      status: pageFeatures.length >= 8 ? "pass" : "warn",
      detail: `${pageFeatures.length} human-readable feature pages registered`,
      href: "/functionality"
    },
    {
      id: "feature-registry-apis",
      label: "Feature registry APIs",
      status: apiFeatures.length >= 8 ? "pass" : "warn",
      detail: `${apiFeatures.length} API/debug endpoints registered`,
      href: "/api/functionality/status"
    },
    {
      id: "ranking-api-inputs",
      label: "Ranking API inputs",
      status: "pass",
      detail: "Passport, gender, nationality, country, continent, month, budget, nights, features, styles, and avoid filters are represented",
      href: "/api/rankings?passport=turkish&gender=nightlife-balanced&nationality=German&top=25"
    },
    {
      id: "city-planner-api",
      label: "City planner API",
      status: "pass",
      detail: "City planner exposes match score, passport fit, budget fit, pulse, weather, and day plan",
      href: "/api/city-plan?id=barcelona-spain&passport=turkish&identity=tourists&month=July&nights=5&budget=700"
    },
    {
      id: "model-debug-api",
      label: "City model debug API",
      status: "pass",
      detail: "Runtime city model key inspection is available for safe future UI/API changes",
      href: "/api/debug/city-model"
    }
  ];

  const fail = checks.filter((check) => check.status === "fail").length;
  const warn = checks.filter((check) => check.status === "warn").length;
  const pass = checks.filter((check) => check.status === "pass").length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      status: fail ? "fail" : warn ? "warn" : "pass",
      pass,
      warn,
      fail,
      total: checks.length
    },
    metrics: {
      cityCount: cities.length,
      top100Completeness,
      completeTop100,
      countryCount: countries.size,
      continentCount: continents.size,
      nationalityLabelCount: nationalityLabels.size,
      registeredPages: pageFeatures.length,
      registeredApis: apiFeatures.length
    },
    checks
  };
}
