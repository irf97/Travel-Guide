export type FeatureStatus = "working" | "stored" | "debug" | "scaffold";

export type SiteFeature = {
  title: string;
  href: string;
  status: FeatureStatus;
  group: "core" | "intelligence" | "tools" | "audit" | "debug";
  description: string;
  acceptance: string[];
};

export const siteFeatures: SiteFeature[] = [
  {
    title: "World Globe",
    href: "/",
    status: "working",
    group: "core",
    description: "Main 3D globe surface with stored ranking logic, passport filter, gender filter, city pulse, city links, and trip saving.",
    acceptance: ["3D globe renders", "city click updates panel", "passport/gender filters change rankings", "stored pulse expands", "city detail link opens"]
  },
  {
    title: "Rankings",
    href: "/rankings",
    status: "working",
    group: "core",
    description: "Main non-map ranking page with sliders, passport/gender filters, visual cards, pulse expansion, save trip, and city detail links.",
    acceptance: ["filters update list", "passport affects score", "gender mode filters list", "visual cards show", "pulse expands", "save trip works"]
  },
  {
    title: "Trips",
    href: "/trips",
    status: "working",
    group: "core",
    description: "Anonymous browser-memory saved trips backed by database when configured.",
    acceptance: ["saved trips list loads", "save from rankings/world/city pages persists", "delete trip works when DB available"]
  },
  {
    title: "City Detail",
    href: "/cities/barcelona-spain",
    status: "working",
    group: "core",
    description: "Individual city page with visuals, pulse, gender, nationality, tourism, venue identity split, and interactive planner.",
    acceptance: ["visual slider visible", "city planner changes with sliders", "save plan works", "city JSON opens"]
  },
  {
    title: "Demographics Dashboard",
    href: "/demographics",
    status: "working",
    group: "core",
    description: "Human-readable gender, nightlife gender, nationality mix, local/tourist share, and confidence dashboard.",
    acceptance: ["aggregated gender metrics render", "nationality mix renders", "top-100 table renders", "city links and country JSON links work"]
  },
  {
    title: "Product Lab",
    href: "/lab",
    status: "working",
    group: "tools",
    description: "Functional city comparison and route logic calculator.",
    acceptance: ["city A/B selectors work", "weights update scores", "winner route logic changes", "winner city opens"]
  },
  {
    title: "Portal",
    href: "/portal",
    status: "working",
    group: "tools",
    description: "Command hub for product pages, APIs, audit, city access, and route testing.",
    acceptance: ["all cards navigate", "API links open", "fast city access opens city pages"]
  },
  {
    title: "Stored City Plan API",
    href: "/api/city-plan?id=barcelona-spain&passport=turkish&identity=tourists&month=July&nights=5&budget=700",
    status: "working",
    group: "tools",
    description: "Machine-readable city planner using stored weather, passport fit, identity venue counts, pulse, budget, and trip length.",
    acceptance: ["returns match score", "returns morning/afternoon/evening/night plan", "returns passport fit", "returns identity venue counts"]
  },
  {
    title: "Audit Dashboard",
    href: "/audit",
    status: "working",
    group: "audit",
    description: "Human-readable top-100 completeness dashboard.",
    acceptance: ["summary metrics render", "review table renders", "city/action links work", "JSON audit opens"]
  },
  {
    title: "Top-100 Audit API",
    href: "/api/audit/top-100",
    status: "working",
    group: "audit",
    description: "JSON completeness audit for visuals, pulse, nationality, gender, venues, weather, tourism, and city pages.",
    acceptance: ["returns total", "returns complete count", "returns city-by-city checks"]
  },
  {
    title: "Functionality Status API",
    href: "/api/functionality/status",
    status: "working",
    group: "audit",
    description: "Machine-readable status map for major product features and top-100 audit summary.",
    acceptance: ["returns feature summary", "returns route links", "returns top-100 summary", "returns feature registry"]
  },
  {
    title: "Stored Rankings API",
    href: "/api/rankings?passport=turkish&gender=nightlife-balanced&top=25",
    status: "working",
    group: "intelligence",
    description: "Machine-readable stored ranking logic matching the UI, including passport, gender, weather, pulse, venues, and tourism.",
    acceptance: ["returns ranked cities", "supports passport", "supports gender", "returns city links and visual slides"]
  },
  {
    title: "Demographics API",
    href: "/api/demographics?continent=Europe&minFemaleNightlife=40&top=25",
    status: "working",
    group: "intelligence",
    description: "Machine-readable demographic layer with gender aggregates, nightlife gender, nationality mix, local/tourist share, and confidence.",
    acceptance: ["returns aggregate gender", "returns aggregate nationality mix", "supports country/continent filters", "returns city-level demographic rows"]
  },
  {
    title: "City Intelligence API",
    href: "/api/city-intelligence?id=barcelona-spain",
    status: "stored",
    group: "intelligence",
    description: "Stored city intelligence endpoint with visuals, pulse, gender, nationality, tourism, venues, and weather.",
    acceptance: ["returns city object", "includes monthlyWeather", "includes pulse", "includes demographics", "includes visuals"]
  },
  {
    title: "Cities API",
    href: "/api/cities?country=Spain",
    status: "stored",
    group: "intelligence",
    description: "Stored city list endpoint with country, continent, and query filtering.",
    acceptance: ["country filter works", "stored intelligence included", "no live provider required"]
  },
  {
    title: "Tourism Snapshot API",
    href: "/api/tourism",
    status: "stored",
    group: "intelligence",
    description: "Stored downloadable-data tourism baseline endpoint.",
    acceptance: ["returns source metadata", "returns countries", "returns EU baseline where available"]
  },
  {
    title: "Health API",
    href: "/api/health",
    status: "debug",
    group: "debug",
    description: "Backend health/status check for database, storage, AI, and providers.",
    acceptance: ["returns JSON", "shows DB status", "shows provider status"]
  }
];

export function featureSummary() {
  const groups = siteFeatures.reduce<Record<string, number>>((acc, feature) => {
    acc[feature.status] = (acc[feature.status] ?? 0) + 1;
    return acc;
  }, {});
  return {
    total: siteFeatures.length,
    working: groups.working ?? 0,
    stored: groups.stored ?? 0,
    debug: groups.debug ?? 0,
    scaffold: groups.scaffold ?? 0
  };
}
