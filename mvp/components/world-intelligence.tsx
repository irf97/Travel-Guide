"use client";

import { useMemo, useState } from "react";
import { Card, Chip, FieldLabel, GhostButton, MetricBar, SectionHeader, SoftCard, StatPill } from "@/components/ui";
import { continents, type Continent, type WorldCity } from "@/lib/world-data";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity } from "@/lib/scoring";

type TopN = 10 | 25 | 50 | 100;
type Metric = "score" | "cost" | "nightlife" | "history" | "social";
type RankedWorldCity = { city: WorldCity; result: ReturnType<typeof scoreCity>; globalRank: number; continentRank: number };

function cityScoreSeedIntent() {
  const intent = defaultIntent();
  intent.desired_features.sea = true;
  intent.desired_features.historic = true;
  intent.desired_features.seafood = true;
  intent.desired_features.young_adults = true;
  intent.desired_features.international_crowd = true;
  intent.desired_features.bars = true;
  intent.avoid.too_crowded = true;
  intent.avoid.tourist_traps = true;
  intent.travel_style = ["social", "culture", "food"];
  return intent;
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function project(lat: number, lng: number, rotation: number) {
  const rad = Math.PI / 180;
  const phi = lat * rad;
  const theta = (lng + rotation) * rad;
  const x = 50 + Math.cos(phi) * Math.sin(theta) * 42;
  const y = 50 - Math.sin(phi) * 42;
  const z = Math.cos(phi) * Math.cos(theta);
  return { x, y, visible: z > -0.15, z };
}

function metricValue(item: RankedWorldCity, metric: Metric) {
  if (metric === "score") return item.result.score;
  if (metric === "cost") return Math.max(0, 100 - item.result.estimatedCost / 20);
  if (metric === "nightlife") return item.city.nightlife_score;
  if (metric === "history") return item.city.history_score;
  return item.city.social_density_score;
}

export function WorldIntelligenceApp({ cities }: { cities: WorldCity[] }) {
  const [topN, setTopN] = useState<TopN>(10);
  const [selectedContinent, setSelectedContinent] = useState<Continent | "All">("All");
  const [metric, setMetric] = useState<Metric>("score");
  const [rotation, setRotation] = useState(0);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const intent = useMemo(() => cityScoreSeedIntent(), []);

  const ranked = useMemo<RankedWorldCity[]>(() => {
    const global = cities.map((city) => ({ city, result: scoreCity(city, intent) })).sort((a, b) => b.result.score - a.result.score);
    const perContinentRank = new Map<string, number>();
    return global.map((item, index) => {
      const current = (perContinentRank.get(item.city.continent) ?? 0) + 1;
      perContinentRank.set(item.city.continent, current);
      return { ...item, globalRank: index + 1, continentRank: current };
    });
  }, [cities, intent]);

  const visibleRanking = useMemo(() => {
    if (selectedContinent === "All") return ranked.slice(0, topN);
    return ranked.filter((item) => item.city.continent === selectedContinent).slice(0, topN);
  }, [ranked, selectedContinent, topN]);

  const continentLeaders = continents.map((continent) => ranked.find((item) => item.city.continent === continent)).filter(Boolean) as RankedWorldCity[];
  const selectedCity = ranked.find((item) => item.city.id === selectedCityId) ?? visibleRanking[0];

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-16">
      <section className="grid gap-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Chip tone="good">world-scale intelligence surface</Chip>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] text-white md:text-7xl">
            Top cities per continent, mapped as a decision globe.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Rank destinations globally or by continent, expand from Top 10 to Top 100, and inspect cities through a 3D-style world visualization.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <GhostButton onClick={() => setSelectedContinent("All")}>Global view</GhostButton>
            <GhostButton onClick={() => setTopN(100)}>Show up to Top 100</GhostButton>
          </div>
        </div>
        <Card>
          <h2 className="text-2xl font-black text-white">Executive summary</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <StatPill label="Cities evaluated" value={ranked.length} note="seed dataset" />
            <StatPill label="Continents" value={continents.length} note="ranking groups" />
            <StatPill label="Current list" value={`Top ${topN}`} note={selectedContinent} />
            <StatPill label="Best city" value={ranked[0]?.city.name ?? "—"} note={ranked[0]?.city.country ?? ""} />
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.74fr_1.26fr]">
        <Card>
          <SectionHeader eyebrow="Controls" title="Ranking lens" body="Change the scope, list depth, and globe overlay metric." />
          <div className="grid gap-4">
            <div>
              <FieldLabel>Scope</FieldLabel>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedContinent("All")} className={`rounded-full px-3 py-2 text-xs font-bold ${selectedContinent === "All" ? "bg-sky-200 text-slate-950" : "border border-white/10 bg-white/[0.05] text-slate-300"}`}>All</button>
                {continents.map((continent) => <button key={continent} onClick={() => setSelectedContinent(continent)} className={`rounded-full px-3 py-2 text-xs font-bold ${selectedContinent === continent ? "bg-sky-200 text-slate-950" : "border border-white/10 bg-white/[0.05] text-slate-300"}`}>{continent}</button>)}
              </div>
            </div>
            <div>
              <FieldLabel>Top N</FieldLabel>
              <div className="flex flex-wrap gap-2">{([10, 25, 50, 100] as TopN[]).map((value) => <button key={value} onClick={() => setTopN(value)} className={`rounded-full px-3 py-2 text-xs font-bold ${topN === value ? "bg-emerald-200 text-slate-950" : "border border-white/10 bg-white/[0.05] text-slate-300"}`}>Top {value}</button>)}</div>
            </div>
            <div>
              <FieldLabel>Globe metric</FieldLabel>
              <div className="grid grid-cols-2 gap-2">{(["score", "cost", "nightlife", "history", "social"] as Metric[]).map((value) => <button key={value} onClick={() => setMetric(value)} className={`rounded-2xl px-3 py-2 text-xs font-bold ${metric === value ? "bg-purple-200 text-slate-950" : "border border-white/10 bg-white/[0.05] text-slate-300"}`}>{labelize(value)}</button>)}</div>
            </div>
            <label className="grid gap-2">
              <div className="flex items-center justify-between text-sm font-bold text-slate-300"><span>Globe rotation</span><span>{rotation}°</span></div>
              <input type="range" min={-180} max={180} value={rotation} onChange={(event) => setRotation(Number(event.target.value))} className="accent-sky-200" />
            </label>
          </div>
        </Card>

        <WorldGlobe ranked={visibleRanking} metric={metric} rotation={rotation} selectedCityId={selectedCity?.city.id ?? null} onSelect={setSelectedCityId} />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <CityDrilldown item={selectedCity} metric={metric} />
        <Card>
          <SectionHeader eyebrow="Continent leaders" title="Best current city per continent" />
          <div className="grid gap-3">
            {continentLeaders.map((item) => (
              <button key={item.city.id} onClick={() => { setSelectedContinent(item.city.continent); setSelectedCityId(item.city.id); }} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left transition hover:border-sky-200/40">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-white">{item.city.continent}: {item.city.name}</h3><p className="mt-1 text-sm text-slate-400">{item.city.country} · #{item.continentRank} continent · #{item.globalRank} global</p></div><Chip tone="good">{item.result.score}</Chip></div>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="py-10">
        <SectionHeader eyebrow="Leaderboard" title={`${selectedContinent === "All" ? "Global" : selectedContinent} Top ${topN}`} body="Top 100 is available, but the MVP dataset currently contains fewer than 100 cities for some continents. The UI is already designed for the larger data layer." />
        <div className="grid gap-3">
          {visibleRanking.map((item) => (
            <button key={item.city.id} onClick={() => setSelectedCityId(item.city.id)} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left transition hover:border-sky-200/40">
              <div className="grid gap-3 md:grid-cols-[70px_1fr_120px] md:items-center">
                <div className="text-2xl font-black text-white">#{selectedContinent === "All" ? item.globalRank : item.continentRank}</div>
                <div><h3 className="text-lg font-black text-white">{item.city.name}, {item.city.country}</h3><p className="text-sm text-slate-400">{item.city.continent} · {item.city.best_neighborhoods.join(" · ")}</p></div>
                <div className="md:text-right"><Chip tone="good">{item.result.score}/100</Chip></div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function WorldGlobe({ ranked, metric, rotation, selectedCityId, onSelect }: { ranked: RankedWorldCity[]; metric: Metric; rotation: number; selectedCityId: string | null; onSelect: (id: string) => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-black text-white">3D world intelligence view</h2><p className="mt-1 text-sm text-slate-400">CSS-rendered globe projection for MVP speed. Points are clickable.</p></div><Chip tone="good">{labelize(metric)}</Chip></div>
      <div className="relative mx-auto aspect-square max-h-[620px] rounded-full border border-sky-200/20 bg-[radial-gradient(circle_at_35%_25%,rgba(186,230,253,0.24),rgba(15,23,42,0.45)_34%,rgba(2,6,23,0.95)_72%)] shadow-[inset_-30px_-25px_80px_rgba(0,0,0,0.55),0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-[7%] rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-white/10" />
        {ranked.map((item) => {
          const point = project(item.city.lat, item.city.lng, rotation);
          const value = metricValue(item, metric);
          const size = Math.max(9, Math.min(24, 6 + value / 6));
          return (
            <button
              key={item.city.id}
              onClick={() => onSelect(item.city.id)}
              title={`${item.city.name}, ${item.city.country} · ${item.result.score}`}
              className={`absolute rounded-full border transition hover:scale-125 ${item.city.id === selectedCityId ? "border-white bg-emerald-200" : "border-sky-100/60 bg-sky-200/80"}`}
              style={{ left: `${point.x}%`, top: `${point.y}%`, width: size, height: size, opacity: point.visible ? 1 : 0.22, transform: `translate(-50%, -50%) scale(${point.visible ? 1 : 0.65})`, boxShadow: item.city.id === selectedCityId ? "0 0 30px rgba(187,247,208,0.9)" : "0 0 18px rgba(186,230,253,0.38)" }}
            />
          );
        })}
      </div>
    </Card>
  );
}

function CityDrilldown({ item, metric }: { item?: RankedWorldCity; metric: Metric }) {
  if (!item) return <Card><p className="text-slate-300">Select a city.</p></Card>;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Selected city</p><h2 className="mt-1 text-3xl font-black text-white">{item.city.name}</h2><p className="mt-1 text-sm text-slate-400">{item.city.country} · {item.city.continent}</p></div><Chip tone="good">{item.result.score}/100</Chip></div>
      <div className="mt-5 grid gap-3 md:grid-cols-3"><StatPill label="Global rank" value={`#${item.globalRank}`} /><StatPill label="Continent rank" value={`#${item.continentRank}`} /><StatPill label="Cost" value={`€${item.result.estimatedCost}`} note="estimated pp" /></div>
      <p className="mt-5 leading-7 text-slate-300">{item.city.notes}</p>
      <div className="mt-5 flex flex-wrap gap-2">{item.city.best_neighborhoods.map((n) => <Chip key={n}>{n}</Chip>)}{item.city.risk_flags.map((risk) => <Chip key={risk} tone="warn">{risk}</Chip>)}</div>
      <div className="mt-5 grid gap-3"><MetricBar label="Selected metric" score={metricValue(item, metric)} /><MetricBar label="Social density" score={item.city.social_density_score} /><MetricBar label="Nightlife" score={item.city.nightlife_score} /><MetricBar label="History" score={item.city.history_score} /><MetricBar label="Food culture" score={item.city.food_culture_score} /><MetricBar label="Mobility" score={item.city.mobility_score} /></div>
    </Card>
  );
}
