export type CityPulse = {
  city: string;
  articleCount: number;
  toneScore: number;
  riskScore: number;
  momentumScore: number;
  demandPressureScore: number;
  source: "GDELT DOC" | "modeled-fallback";
  confidence: "medium" | "low";
  headlines: Array<{ title: string; url?: string; source?: string }>;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function fetchGdeltCityPulse(city: string): Promise<{ ok: true; data: CityPulse } | { ok: false; error: string; fallback: CityPulse }> {
  const fallback: CityPulse = {
    city,
    articleCount: 0,
    toneScore: 0,
    riskScore: 35,
    momentumScore: 45,
    demandPressureScore: 50,
    source: "modeled-fallback",
    confidence: "low",
    headlines: []
  };

  if (!city.trim()) return { ok: false, error: "Missing city", fallback };
  const base = process.env.GDELT_DOC_API_BASE ?? process.env.GDELT_DOC_BASE_URL ?? "https://api.gdeltproject.org/api/v2/doc/doc";
  const url = new URL(base);
  url.searchParams.set("query", `"${city}"`);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", "20");
  url.searchParams.set("sort", "hybridrel");
  url.searchParams.set("timespan", "7d");

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
    if (!response.ok) return { ok: false, error: `GDELT returned ${response.status}`, fallback };
    const json = await response.json();
    const articles = Array.isArray(json?.articles) ? json.articles : [];
    const joined = articles.map((article: any) => `${article.title ?? ""} ${article.seendate ?? ""}`).join(" ").toLowerCase();
    const riskTerms = ["protest", "strike", "riot", "crime", "storm", "fire", "attack", "delay", "closure", "flood"];
    const positiveTerms = ["festival", "tourism", "opening", "concert", "growth", "summer", "travel", "culture"];
    const riskHits = riskTerms.reduce((sum, term) => sum + (joined.includes(term) ? 1 : 0), 0);
    const positiveHits = positiveTerms.reduce((sum, term) => sum + (joined.includes(term) ? 1 : 0), 0);
    const articleCount = articles.length;
    const riskScore = clamp(22 + riskHits * 12 + Math.max(0, articleCount - 12) * 2);
    const momentumScore = clamp(35 + articleCount * 3 + positiveHits * 6);
    const toneScore = clamp(50 + positiveHits * 6 - riskHits * 7);
    const demandPressureScore = clamp(momentumScore * 0.55 + (100 - riskScore) * 0.2 + articleCount * 2.2);
    return {
      ok: true,
      data: {
        city,
        articleCount,
        toneScore,
        riskScore,
        momentumScore,
        demandPressureScore,
        source: "GDELT DOC",
        confidence: "medium",
        headlines: articles.slice(0, 5).map((article: any) => ({ title: String(article.title ?? "Untitled"), url: article.url, source: article.domain }))
      }
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), fallback };
  }
}
