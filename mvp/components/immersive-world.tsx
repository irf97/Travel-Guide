"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Chip, MetricBar, StatPill } from "@/components/ui";
import { continents, type Continent, type WorldCity } from "@/lib/world-data";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity } from "@/lib/scoring";
import styles from "./world-ui.module.css";

type TopN = 10 | 25 | 50 | 100;
type Metric = "score" | "cost" | "nightlife" | "history" | "social";
type Ranked = { city: WorldCity; result: ReturnType<typeof scoreCity>; globalRank: number; continentRank: number };

function makeIntent() {
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
  const r = Math.PI / 180;
  const phi = lat * r;
  const theta = (lng + rotation) * r;
  return {
    x: 50 + Math.cos(phi) * Math.sin(theta) * 43,
    y: 50 - Math.sin(phi) * 43,
    visible: Math.cos(phi) * Math.cos(theta) > -0.18
  };
}

function metricValue(item: Ranked, metric: Metric) {
  if (metric === "cost") return Math.max(0, 100 - item.result.estimatedCost / 20);
  if (metric === "nightlife") return item.city.nightlife_score;
  if (metric === "history") return item.city.history_score;
  if (metric === "social") return item.city.social_density_score;
  return item.result.score;
}

export function ImmersiveWorld({ cities }: { cities: WorldCity[] }) {
  const [topN, setTopN] = useState<TopN>(10);
  const [continent, setContinent] = useState<Continent | "All">("All");
  const [metric, setMetric] = useState<Metric>("score");
  const [rotation, setRotation] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const intent = useMemo(makeIntent, []);

  const ranked = useMemo<Ranked[]>(() => {
    const global = cities.map((city) => ({ city, result: scoreCity(city, intent) })).sort((a, b) => b.result.score - a.result.score);
    const counts = new Map<string, number>();
    return global.map((item, index) => {
      const rank = (counts.get(item.city.continent) ?? 0) + 1;
      counts.set(item.city.continent, rank);
      return { ...item, globalRank: index + 1, continentRank: rank };
    });
  }, [cities, intent]);

  const visible = useMemo(() => (continent === "All" ? ranked : ranked.filter((item) => item.city.continent === continent)).slice(0, topN), [ranked, continent, topN]);
  const selected = ranked.find((item) => item.city.id === selectedId) ?? visible[0] ?? ranked[0];
  const leaders = continents.map((c) => ranked.find((item) => item.city.continent === c)).filter(Boolean) as Ranked[];

  return (
    <main className={styles.shell}>
      <div className={styles.space}><div className={styles.stars} /></div>
      <header className={styles.topbar}>
        <div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">Social Travel Intelligence OS</p><h1 className="text-xl font-black tracking-[-0.04em] md:text-2xl">World Intelligence</h1></div>
        <nav className="flex gap-2 overflow-x-auto"><Link className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-slate-200" href="/portal">Portal</Link><Link className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-slate-200" href="/">App</Link><Link className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-slate-200" href="/lab">Lab</Link></nav>
      </header>

      <section className={styles.layout}>
        <aside className={styles.glass}>
          <Chip tone="good">planet filters</Chip>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Planet-scale ranking lens</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Filter the world by continent, ranking depth, and visual overlay. The globe stays central like a command surface.</p>
          <div className="mt-5 grid grid-cols-2 gap-3"><StatPill label="Cities" value={ranked.length} /><StatPill label="Best" value={ranked[0]?.city.name ?? "—"} note={ranked[0]?.city.country} /></div>
          <Control title="Continent"><ButtonGrid values={["All", ...continents]} active={continent} onSelect={(v) => setContinent(v as Continent | "All")} /></Control>
          <Control title="Ranking depth"><ButtonGrid values={[10, 25, 50, 100]} active={topN} onSelect={(v) => setTopN(v as TopN)} prefix="Top " /></Control>
          <Control title="Globe overlay"><ButtonGrid values={["score", "cost", "nightlife", "history", "social"]} active={metric} onSelect={(v) => setMetric(v as Metric)} formatter={(v) => labelize(String(v))} /></Control>
          <Control title="Rotation"><div className="flex items-center justify-between text-xs font-bold text-slate-300"><span>longitude sweep</span><span>{rotation}°</span></div><input className="mt-3 w-full accent-cyan-200" type="range" min={-180} max={180} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} /></Control>
          <Control title="Preference profile"><div className="flex flex-wrap gap-2">{["social", "culture", "food", "sea", "historic", "seafood", "bars", "young adults"].map((item) => <Chip key={item}>{item}</Chip>)}</div></Control>
        </aside>

        <section className={styles.stage}>
          <div className={styles.orbit1} /><div className={styles.orbit2} />
          <Globe ranked={visible} metric={metric} rotation={rotation} selectedId={selected?.city.id ?? null} onSelect={setSelectedId} />
          <div className={styles.current}><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">Current world surface</p><p className="mt-1 text-sm font-semibold text-slate-200">{continent === "All" ? "Global" : continent} · Top {topN} · overlay: {labelize(metric)}</p></div>
        </section>

        <aside className={styles.glass}>
          <Chip tone="good">city intelligence</Chip>
          <CityPanel item={selected} metric={metric} />
          <Control title="Continent winners"><div className="grid gap-2">{leaders.map((item) => <button key={item.city.id} onClick={() => { setContinent(item.city.continent); setSelectedId(item.city.id); }} className="rounded-2xl border border-white/10 bg-black/15 p-3 text-left hover:border-cyan-200/40"><div className="flex justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{item.city.continent}</p><h3 className="mt-1 text-sm font-black text-white">{item.city.name}</h3></div><span className="text-sm font-black text-cyan-100">{item.result.score}</span></div></button>)}</div></Control>
          <Control title="Visible leaderboard"><div className="grid gap-2">{visible.slice(0, 12).map((item) => <button key={item.city.id} onClick={() => setSelectedId(item.city.id)} className="rounded-2xl border border-white/10 bg-black/15 p-3 text-left hover:border-cyan-200/40"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">#{item.globalRank} global</p><h3 className="mt-1 text-sm font-black text-white">{item.city.name}</h3></div><Chip tone="good">{item.result.score}</Chip></div></button>)}</div></Control>
        </aside>
      </section>
    </main>
  );
}

function Control({ title, children }: { title: string; children: ReactNode }) { return <div className={styles.control}><p className={styles.controlTitle}>{title}</p>{children}</div>; }
function ButtonGrid({ values, active, onSelect, prefix = "", formatter }: { values: Array<string | number>; active: string | number; onSelect: (v: string | number) => void; prefix?: string; formatter?: (v: string | number) => string }) { return <div className="flex flex-wrap gap-2">{values.map((v) => <button key={String(v)} onClick={() => onSelect(v)} className={`${styles.filter} ${active === v ? styles.filterActive : ""}`}>{prefix}{formatter ? formatter(v) : String(v)}</button>)}</div>; }

function Globe({ ranked, metric, rotation, selectedId, onSelect }: { ranked: Ranked[]; metric: Metric; rotation: number; selectedId: string | null; onSelect: (id: string) => void }) {
  const blobs = ["left-[17%] top-[24%] h-[23%] w-[18%] rotate-[-18deg]", "left-[24%] top-[47%] h-[28%] w-[13%] rotate-[12deg]", "left-[46%] top-[22%] h-[21%] w-[17%] rotate-[8deg]", "left-[55%] top-[28%] h-[30%] w-[27%] rotate-[18deg]", "left-[50%] top-[55%] h-[24%] w-[12%] rotate-[-10deg]", "left-[74%] top-[61%] h-[13%] w-[15%] rotate-[8deg]"];
  return <div className={styles.globeWrap}><div className={styles.globe}><div className={styles.grid} /><div className={styles.landLayer} style={{ transform: `translateX(${rotation / 8}px)` }}>{blobs.map((c) => <div key={c} className={`${styles.land} ${c}`} />)}</div><div className={styles.shine} />{ranked.map((item) => { const p = project(item.city.lat, item.city.lng, rotation); const size = Math.max(9, Math.min(26, 7 + metricValue(item, metric) / 5.5)); return <button key={item.city.id} onClick={() => onSelect(item.city.id)} title={`${item.city.name}, ${item.city.country}`} className={`${styles.point} ${item.city.id === selectedId ? styles.pointActive : ""}`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: size, height: size, opacity: p.visible ? 1 : 0.18, transform: `translate(-50%, -50%) scale(${p.visible ? 1 : 0.55})` }} />; })}</div></div>;
}

function CityPanel({ item, metric }: { item?: Ranked; metric: Metric }) {
  if (!item) return <p className="mt-4 text-slate-300">Select a city.</p>;
  return <div className="mt-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Selected city</p><h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">{item.city.name}</h2><p className="mt-1 text-sm text-slate-400">{item.city.country} · {item.city.continent}</p></div><Chip tone="good">{item.result.score}/100</Chip></div><div className="mt-5 grid grid-cols-3 gap-3"><StatPill label="Global" value={`#${item.globalRank}`} /><StatPill label="Continent" value={`#${item.continentRank}`} /><StatPill label="Cost" value={`€${item.result.estimatedCost}`} /></div><p className="mt-5 text-sm leading-6 text-slate-300">{item.city.notes}</p><div className="mt-5 flex flex-wrap gap-2">{item.city.best_neighborhoods.map((n) => <Chip key={n}>{n}</Chip>)}{item.city.risk_flags.map((risk) => <Chip key={risk} tone="warn">{risk}</Chip>)}</div><div className="mt-5 grid gap-3"><MetricBar label="Selected metric" score={metricValue(item, metric)} /><MetricBar label="Social density" score={item.city.social_density_score} /><MetricBar label="Nightlife" score={item.city.nightlife_score} /><MetricBar label="History" score={item.city.history_score} /><MetricBar label="Food culture" score={item.city.food_culture_score} /><MetricBar label="Mobility" score={item.city.mobility_score} /></div></div>;
}
