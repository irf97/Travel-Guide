"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { worldCities, continents, type Continent, type WorldCity } from "@/lib/world-data";
import { getCityDemographicModel } from "@/lib/city-demographics";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity } from "@/lib/scoring";
import type { AvoidKey, FeatureKey, TravelStyle } from "@/lib/types";

const monthOptions = ["March", "April", "May", "June", "July", "August", "September", "October"];
const travelStyles: Array<{ label: string; value: TravelStyle }> = [
  { label: "Balanced", value: "balanced" }, { label: "Social", value: "social" }, { label: "Nightlife", value: "nightlife" }, { label: "Culture", value: "culture" }, { label: "Food", value: "food" }, { label: "Budget", value: "budget" }, { label: "Remote", value: "remote-work" }
];
const features: Array<{ label: string; value: FeatureKey }> = [
  { label: "Nightlife", value: "bars" }, { label: "Clubs", value: "clubs" }, { label: "Food", value: "local_food" }, { label: "Historic", value: "historic" }, { label: "Sea", value: "sea" }, { label: "International", value: "international_crowd" }, { label: "Young adults", value: "young_adults" }, { label: "Coworking", value: "coworking" }
];
const avoidances: Array<{ label: string; value: AvoidKey }> = [
  { label: "Too Crowded", value: "too_crowded" }, { label: "Tourist Traps", value: "tourist_traps" }, { label: "Expensive", value: "expensive" }, { label: "Car Dependent", value: "car_dependent" }, { label: "Dead Nightlife", value: "dead_nightlife" }
];
const sortModes = ["overall", "cheapest", "nightlife", "history", "international", "gender-balance", "tourism-demand", "confidence"] as const;
type SortMode = typeof sortModes[number];

type Ranked = {
  city: WorldCity;
  score: number;
  cost: number;
  featureFit: number;
  seasonality: number;
  riskPenalty: number;
  demographics: ReturnType<typeof getCityDemographicModel>;
};

function toggle<T extends string>(list: T[], value: T) { return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function makeIntent(input: { budget: number; nights: number; month: string; styles: TravelStyle[]; features: FeatureKey[]; avoid: AvoidKey[] }) {
  const intent = defaultIntent();
  intent.budget.per_person_eur = input.budget;
  intent.budget.sensitivity = input.budget <= 800 ? "high" : input.budget <= 1300 ? "medium" : "low";
  intent.dates.month = input.month;
  intent.dates.nights = input.nights;
  intent.travel_style = input.styles.length ? input.styles : ["balanced"];
  Object.keys(intent.desired_features).forEach((key) => { intent.desired_features[key as FeatureKey] = false; });
  input.features.forEach((feature) => { intent.desired_features[feature] = true; });
  Object.keys(intent.avoid).forEach((key) => { intent.avoid[key as AvoidKey] = false; });
  input.avoid.forEach((avoid) => { intent.avoid[avoid] = true; });
  return intent;
}

export default function RankingsPage() {
  const countries = useMemo(() => [...new Set(worldCities.map((city) => city.country))].sort(), []);
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState<Continent | "All">("All");
  const [country, setCountry] = useState("All");
  const [budget, setBudget] = useState(1000);
  const [nights, setNights] = useState(14);
  const [month, setMonth] = useState("July");
  const [styles, setStyles] = useState<TravelStyle[]>(["social", "culture", "food"]);
  const [wanted, setWanted] = useState<FeatureKey[]>(["bars", "local_food", "historic", "international_crowd", "young_adults"]);
  const [avoid, setAvoid] = useState<AvoidKey[]>(["car_dependent"]);
  const [sortMode, setSortMode] = useState<SortMode>("overall");
  const [selectedId, setSelectedId] = useState("barcelona-spain");
  const [saveMessage, setSaveMessage] = useState("");

  const intent = useMemo(() => makeIntent({ budget, nights, month, styles, features: wanted, avoid }), [budget, nights, month, styles, wanted, avoid]);

  const ranked = useMemo<Ranked[]>(() => {
    const q = query.toLowerCase().trim();
    const rows = worldCities
      .filter((city) => continent === "All" || city.continent === continent)
      .filter((city) => country === "All" || city.country === country)
      .filter((city) => !q || `${city.name} ${city.country} ${city.continent} ${city.types.join(" ")} ${city.best_neighborhoods.join(" ")} ${city.nationality_mix_context}`.toLowerCase().includes(q))
      .map((city) => {
        const result = scoreCity(city, intent);
        const demographics = getCityDemographicModel(city);
        return { city, score: result.score, cost: result.estimatedCost, featureFit: result.featureFit, seasonality: result.seasonality, riskPenalty: result.riskPenalty, demographics };
      });

    return rows.sort((a, b) => {
      if (sortMode === "cheapest") return a.cost - b.cost;
      if (sortMode === "nightlife") return b.city.nightlife_score - a.city.nightlife_score;
      if (sortMode === "history") return b.city.history_score - a.city.history_score;
      if (sortMode === "international") return b.demographics.internationalCrowdScore - a.demographics.internationalCrowdScore;
      if (sortMode === "gender-balance") return b.demographics.genderBalanceScore - a.demographics.genderBalanceScore;
      if (sortMode === "tourism-demand") return b.demographics.touristVisitorShare - a.demographics.touristVisitorShare;
      if (sortMode === "confidence") return b.demographics.confidenceScore - a.demographics.confidenceScore;
      return b.score - a.score;
    });
  }, [query, continent, country, intent, sortMode]);

  const selected = ranked.find((row) => row.city.id === selectedId) ?? ranked[0];

  async function save(row: Ranked) {
    const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `${row.city.name}, ${row.city.country}`, cityId: row.city.id, month, budgetLevel: budget <= 800 ? "Low" : budget <= 1300 ? "Medium" : "High", goal: styles.join("-") || "balanced", computedScore: row.score, notes: `Saved from /rankings. Sort: ${sortMode}. Cost €${row.cost}. Gender balance ${row.demographics.genderBalanceScore}. International score ${row.demographics.internationalCrowdScore}. Tourist share ${row.demographics.touristVisitorShare}.` }) });
    const json = await response.json();
    setSaveMessage(json?.data?.message ?? "Saved.");
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
    <section className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Main ranking engine</p><h1 className="mt-3 text-4xl font-black tracking-[-0.055em] md:text-6xl">City rankings without the map</h1><p className="mt-4 max-w-3xl text-slate-300">All filters feed the same scoring pipeline as `/world`, plus country filtering, gender balance, nationality mix, tourist composition, and source confidence labels.</p></div>
        <div className="flex gap-2"><Link className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-slate-300" href="/world">World map</Link><Link className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950" href="/trips">Trips</Link></div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <input className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search city/country/neighborhood" />
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={continent} onChange={(e)=>setContinent(e.target.value as Continent | "All")}><option>All</option>{continents.map((c)=><option key={c}>{c}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={country} onChange={(e)=>setCountry(e.target.value)}><option>All</option>{countries.map((c)=><option key={c}>{c}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={sortMode} onChange={(e)=>setSortMode(e.target.value as SortMode)}>{sortModes.map((m)=><option key={m}>{m}</option>)}</select>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><Slider label="Budget" value={`€${budget}`} min={500} max={2500} step={50} state={budget} setState={setBudget}/><Slider label="Stay length" value={`${nights} nights`} min={3} max={30} step={1} state={nights} setState={setNights}/></div>
      <ChipGroup title="Month" items={monthOptions.map((m)=>({label:m,value:m}))} active={[month]} onClick={(v)=>setMonth(v)}/>
      <ChipGroup title="Travel style" items={travelStyles} active={styles} onClick={(v)=>setStyles(toggle(styles, v))}/>
      <ChipGroup title="Desired features" items={features} active={wanted} onClick={(v)=>setWanted(toggle(wanted, v))}/>
      <ChipGroup title="Avoidances" items={avoidances} active={avoid} onClick={(v)=>setAvoid(toggle(avoid, v))}/>
      {saveMessage ? <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{saveMessage}</div> : null}
    </section>

    <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-[1.5fr_.9fr]">
      <div className="grid gap-3">
        {ranked.slice(0, 60).map((row, index) => <button key={row.city.id} onClick={()=>setSelectedId(row.city.id)} className={`rounded-[1.5rem] border p-4 text-left backdrop-blur-xl transition ${selected?.city.id===row.city.id ? "border-sky-200 bg-sky-200/10" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">#{index+1} · {row.city.country} · {row.city.continent}</div><h2 className="mt-1 text-2xl font-black">{row.city.name}</h2><p className="mt-1 text-sm text-slate-400">€{row.cost} · {month} · {nights} nights · {row.demographics.sourceLabel}</p></div><div className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950">{row.score}/100</div></div>
          <div className="mt-4 grid gap-2 md:grid-cols-5"><Mini label="Nightlife" value={row.city.nightlife_score}/><Mini label="Gender bal." value={row.demographics.genderBalanceScore}/><Mini label="Intl" value={row.demographics.internationalCrowdScore}/><Mini label="Tourist" value={row.demographics.touristVisitorShare}/><Mini label="Conf." value={row.demographics.confidenceScore}/></div>
        </button>)}
      </div>
      {selected ? <aside className="sticky top-4 h-fit rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <h2 className="text-3xl font-black">{selected.city.name}</h2><p className="text-sm text-slate-400">{selected.city.country} · {selected.city.continent}</p>
        <div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Score" value={`${selected.score}`}/><Metric label="Cost" value={`€${selected.cost}`}/><Metric label="Local" value={`${selected.demographics.localResidentShare}%`}/><Metric label="Tourist" value={`${selected.demographics.touristVisitorShare}%`}/></div>
        <button onClick={()=>save(selected)} className="mt-4 w-full rounded-full bg-emerald-200 px-4 py-3 text-sm font-black text-slate-950">Save city</button>
        <h3 className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-sky-200">Gender mix</h3>
        <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">Nightlife: {selected.demographics.nightlifeGenderMix.male}% male · {selected.demographics.nightlifeGenderMix.female}% female · {selected.demographics.nightlifeGenderMix.unknown}% unknown<br/>General: {selected.demographics.generalGenderMix.male}% male · {selected.demographics.generalGenderMix.female}% female</div>
        <h3 className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-sky-200">Tourist nationality mix</h3>
        <div className="mt-2 grid gap-2">{selected.demographics.touristNationalityMix.map((item)=><div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="flex justify-between text-sm"><span>{item.label}</span><b>{item.share}%</b></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-200" style={{width:`${item.share}%`}}/></div></div>)}</div>
        <h3 className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-sky-200">Resident / visitor composition</h3>
        <div className="mt-2 grid gap-2">{selected.demographics.nationalityMix.map((item)=><div key={item.label} className="flex justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm"><span>{item.label}</span><b>{item.share}%</b></div>)}</div>
        <p className="mt-4 text-xs leading-5 text-slate-500">{selected.demographics.note}</p>
      </aside> : null}
    </section>
  </main>;
}

function Slider({label,value,min,max,step,state,setState}:{label:string;value:string;min:number;max:number;step:number;state:number;setState:(n:number)=>void}){return <label className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="mb-2 flex justify-between text-sm font-black"><span>{label}</span><span>{value}</span></div><input className="w-full" type="range" min={min} max={max} step={step} value={state} onChange={(e)=>setState(Number(e.target.value))}/></label>}
function ChipGroup<T extends string>({title,items,active,onClick}:{title:string;items:Array<{label:string;value:T}>;active:T[];onClick:(v:T)=>void}){return <div className="mt-4"><div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{title}</div><div className="flex flex-wrap gap-2">{items.map((item)=><button key={item.value} onClick={()=>onClick(item.value)} className={`rounded-full px-3 py-2 text-xs font-black ${active.includes(item.value)?"bg-sky-200 text-slate-950":"border border-white/10 text-slate-300"}`}>{item.label}</button>)}</div></div>}
function Mini({label,value}:{label:string;value:number}){return <div><div className="mb-1 flex justify-between text-[10px] font-black uppercase text-slate-400"><span>{label}</span><span>{value}</span></div><div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-200" style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="text-2xl font-black">{value}</div></div>}
