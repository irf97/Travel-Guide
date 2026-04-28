"use client";

import { useMemo, useState } from "react";
import { continents, type Continent } from "@/lib/world-data";
import { getAllCityIntelligence, type CityIntelligence, type MonthName } from "@/lib/city-intelligence";
import { passportFit, type PassportProfile } from "@/lib/passport";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity } from "@/lib/scoring";
import type { AvoidKey, FeatureKey, TravelStyle } from "@/lib/types";
import { Real3DGlobe } from "@/components/real-3d-globe";

type TopN = 10 | 25 | 50 | 100;
type GenderMode = "any" | "balanced" | "female-leaning" | "male-leaning" | "nightlife-balanced";
type Ranked = { city: CityIntelligence; score: number; globalRank: number; continentRank: number; cost: number; featureFit: number; riskPenalty: number; passportScore: number; passportLabel: string; genderScore: number; memoryBoost: number };

const months: MonthName[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const passportOptions: Array<{ label: string; value: PassportProfile }> = [
  { label: "Any", value: "any" }, { label: "EU", value: "eu" }, { label: "UK", value: "uk" }, { label: "US/Canada", value: "us-canada" }, { label: "Turkish", value: "turkish" }, { label: "Visa flexible", value: "visa-flexible" }
];
const genderOptions: Array<{ label: string; value: GenderMode }> = [
  { label: "Any", value: "any" }, { label: "Balanced", value: "balanced" }, { label: "Female-leaning", value: "female-leaning" }, { label: "Male-leaning", value: "male-leaning" }, { label: "Nightlife balanced", value: "nightlife-balanced" }
];
const travelStyles: Array<{ label: string; value: TravelStyle }> = [
  { label: "Social", value: "social" }, { label: "Nightlife", value: "nightlife" }, { label: "Culture", value: "culture" }, { label: "Food", value: "food" }, { label: "Budget", value: "budget" }, { label: "Remote", value: "remote-work" }
];
const features: Array<{ label: string; value: FeatureKey }> = [
  { label: "Bars", value: "bars" }, { label: "Clubs", value: "clubs" }, { label: "Food", value: "local_food" }, { label: "Historic", value: "historic" }, { label: "Sea", value: "sea" }, { label: "International", value: "international_crowd" }, { label: "Young adults", value: "young_adults" }
];
const avoids: Array<{ label: string; value: AvoidKey }> = [
  { label: "Crowded", value: "too_crowded" }, { label: "Tourist traps", value: "tourist_traps" }, { label: "Expensive", value: "expensive" }, { label: "Car dependent", value: "car_dependent" }, { label: "Dead nightlife", value: "dead_nightlife" }
];

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function toggle<T extends string>(items: T[], value: T) { return items.includes(value) ? items.filter((item) => item !== value) : [...items, value]; }
function genderPass(city: CityIntelligence, mode: GenderMode) {
  const night = city.demographics.nightlifeGenderMix;
  if (mode === "any") return true;
  if (mode === "balanced") return city.demographics.genderBalanceScore >= 88;
  if (mode === "female-leaning") return night.female >= 45;
  if (mode === "male-leaning") return night.male >= 54;
  return Math.abs(night.male - night.female) <= 10;
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

export function WorldCommandCenter() {
  const cities = useMemo(() => getAllCityIntelligence(), []);
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState<Continent | "All">("All");
  const [topN, setTopN] = useState<TopN>(25);
  const [month, setMonth] = useState<MonthName>("July");
  const [budget, setBudget] = useState(1000);
  const [nights, setNights] = useState(14);
  const [passport, setPassport] = useState<PassportProfile>("any");
  const [genderMode, setGenderMode] = useState<GenderMode>("any");
  const [styles, setStyles] = useState<TravelStyle[]>(["social", "culture", "food"]);
  const [wanted, setWanted] = useState<FeatureKey[]>(["bars", "clubs", "local_food", "international_crowd"]);
  const [avoid, setAvoid] = useState<AvoidKey[]>(["car_dependent"]);
  const [selectedId, setSelectedId] = useState("barcelona-spain");
  const [expandedPulseId, setExpandedPulseId] = useState<string | null>("barcelona-spain");
  const [saveMessage, setSaveMessage] = useState("");

  const intent = useMemo(() => makeIntent({ budget, nights, month, styles, wanted, avoid }), [budget, nights, month, styles, wanted, avoid]);
  const ranked = useMemo<Ranked[]>(() => {
    const q = query.toLowerCase().trim();
    const rows = cities
      .filter((city) => continent === "All" || city.continent === continent)
      .filter((city) => genderPass(city, genderMode))
      .filter((city) => !q || `${city.name} ${city.country} ${city.continent} ${city.best_neighborhoods.join(" ")} ${city.types.join(" ")}`.toLowerCase().includes(q))
      .map((city) => {
        const base = scoreCity(city, intent);
        const passportResult = passportFit(city, passport);
        const weather = city.monthlyWeather[month];
        const storedBoost = (city.pulse.demandPressure - 50) * 0.055 + (city.venues.densityScore - 50) * 0.045 + (city.tourism.cityTourismDemandScore - 50) * 0.045 + (weather.weatherComfort - 50) * 0.04;
        const genderScore = city.demographics.genderBalanceScore;
        const score = clamp(base.score + storedBoost + passportResult.score * 0.055 + genderScore * 0.035 - 9);
        return { city, score, cost: base.estimatedCost, globalRank: 0, continentRank: 0, featureFit: base.featureFit, riskPenalty: base.riskPenalty, passportScore: passportResult.score, passportLabel: passportResult.label, genderScore, memoryBoost: 0 };
      })
      .sort((a, b) => b.score - a.score);
    const counts = new Map<string, number>();
    return rows.map((row, index) => {
      const continentRank = (counts.get(row.city.continent) ?? 0) + 1;
      counts.set(row.city.continent, continentRank);
      return { ...row, globalRank: index + 1, continentRank };
    });
  }, [cities, continent, genderMode, query, intent, passport, month]);

  const visible = ranked.slice(0, topN);
  const selected = ranked.find((row) => row.city.id === selectedId) ?? visible[0] ?? ranked[0];
  const activePulse = ranked.find((row) => row.city.id === expandedPulseId) ?? selected;
  const auditComplete = cities.slice(0, 100).filter((city) => city.visuals?.slides?.length >= 5 && city.pulse?.headlines?.length && city.demographics?.touristNationalityMix?.length && city.identityVenueCounts?.locals && city.monthlyWeather?.July && city.tourism?.cityTourismDemandScore).length;

  async function saveSelectedTrip() {
    if (!selected) return;
    const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `${selected.city.name}, ${selected.city.country}`, cityId: selected.city.id, month, budgetLevel: budget <= 800 ? "Low" : budget <= 1300 ? "Medium" : "High", goal: styles.join("-"), computedScore: selected.score, notes: `Saved from globe. Passport ${passport}: ${selected.passportLabel}. Gender filter ${genderMode}. Pulse ${selected.city.pulse.demandPressure}. Venue density ${selected.city.venues.densityScore}.` }) });
    const json = await response.json();
    setSaveMessage(json?.data?.message ?? "Trip saved.");
  }

  return <main className="min-h-screen px-4 py-8 text-white">
    <section className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Main globe intelligence page</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.055em] md:text-6xl">World globe command center</h1>
          <p className="mt-3 max-w-3xl text-slate-300">The globe now uses the same stored city-intelligence layer as Rankings: passport fit, gender mix, stored pulse, tourism, venues, visuals, monthly weather, and city pages.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black"><a className="rounded-full bg-sky-200 px-4 py-2 text-slate-950" href="/rankings">Rankings</a><a className="rounded-full border border-white/10 px-4 py-2 text-slate-300" href="/portal">Portal</a><a className="rounded-full border border-white/10 px-4 py-2 text-slate-300" href="/api/audit/top-100">Audit API</a></div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <input className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city, country, neighborhood" />
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={continent} onChange={(event)=>setContinent(event.target.value as Continent | "All")}><option>All</option>{continents.map((item)=><option key={item}>{item}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={passport} onChange={(event)=>setPassport(event.target.value as PassportProfile)}>{passportOptions.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={genderMode} onChange={(event)=>setGenderMode(event.target.value as GenderMode)}>{genderOptions.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3"><Slider label="Budget" value={`€${budget}`} min={500} max={2500} step={50} state={budget} setState={setBudget}/><Slider label="Stay" value={`${nights} nights`} min={3} max={30} step={1} state={nights} setState={setNights}/><label className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="mb-2 text-sm font-black">Month</div><select className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm" value={month} onChange={(event)=>setMonth(event.target.value as MonthName)}>{months.map((item)=><option key={item}>{item}</option>)}</select></label></div>
      <ChipGroup title="Travel style" items={travelStyles} active={styles} onClick={(value)=>setStyles(toggle(styles, value))}/>
      <ChipGroup title="Desired features" items={features} active={wanted} onClick={(value)=>setWanted(toggle(wanted, value))}/>
      <ChipGroup title="Avoid" items={avoids} active={avoid} onClick={(value)=>setAvoid(toggle(avoid, value))}/>
      <ChipGroup title="Globe density" items={[10,25,50,100].map((n)=>({label:`Top ${n}`, value:String(n)}))} active={[String(topN)]} onClick={(value)=>setTopN(Number(value) as TopN)}/>
    </section>

    <section className="mx-auto mt-6 grid max-w-7xl gap-6 xl:grid-cols-[.72fr_1.18fr_.72fr]">
      <aside className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
        <h2 className="text-xl font-black">Top filtered cities</h2>
        <div className="mt-4 grid gap-2">{visible.slice(0, 10).map((row)=><button key={row.city.id} onClick={()=>setSelectedId(row.city.id)} className={`rounded-2xl border p-3 text-left transition ${selected?.city.id === row.city.id ? "border-sky-200 bg-sky-200/10" : "border-white/10 bg-slate-950/45 hover:border-white/25"}`}><div className="flex justify-between gap-2"><span className="font-black">#{row.globalRank} {row.city.visuals.flag} {row.city.name}</span><b>{row.score}</b></div><p className="mt-1 text-xs text-slate-400">{row.passportLabel} · gender {row.genderScore} · pulse {row.city.pulse.demandPressure}</p></button>)}</div>
      </aside>

      <section className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-sky-200/15 bg-slate-950/50 backdrop-blur-xl">
        <div className="absolute left-4 top-4 z-10 rounded-2xl border border-white/10 bg-slate-950/75 p-4 backdrop-blur-xl"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Matched cities</div><div className="text-4xl font-black">{visible.length}</div></div>
        <button onClick={()=>setExpandedPulseId(selected?.city.id ?? null)} className="absolute right-4 top-4 z-10 rounded-2xl border border-sky-200/20 bg-sky-200/10 p-4 text-left backdrop-blur-xl"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Stored pulse</div><div className="text-4xl font-black text-sky-200">{selected?.city.pulse.demandPressure ?? 0}</div><div className="text-xs text-slate-400">Click for detail</div></button>
        <Real3DGlobe cities={visible} selectedId={selected?.city.id ?? ""} onSelect={setSelectedId}/>
      </section>

      {selected ? <aside className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-3xl font-black">{selected.city.visuals.flag} {selected.city.name}</h2><p className="text-sm text-slate-400">{selected.city.country} · #{selected.globalRank} global · #{selected.continentRank} {selected.city.continent}</p></div><div className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950">{selected.score}</div></div>
        <div className="mt-4 flex gap-2"><button onClick={saveSelectedTrip} className="flex-1 rounded-full bg-emerald-200 px-4 py-3 text-sm font-black text-slate-950">Save trip</button><a href={`/cities/${selected.city.id}`} className="rounded-full border border-white/10 px-4 py-3 text-sm font-black text-slate-200">City page</a></div>
        {saveMessage ? <div className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{saveMessage}</div> : null}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{selected.city.visuals.slides.map((slide)=><div key={slide.kind} className="min-w-[116px] rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="text-3xl">{slide.label}</div><div className="mt-2 text-xs font-black">{slide.title}</div></div>)}</div>
        <div className="mt-4 grid gap-2"><Mini label="Passport" value={selected.passportScore}/><Mini label="Gender balance" value={selected.genderScore}/><Mini label="Pulse demand" value={selected.city.pulse.demandPressure}/><Mini label="Venue density" value={selected.city.venues.densityScore}/><Mini label="Tourism" value={selected.city.tourism.cityTourismDemandScore}/><Mini label="Weather" value={selected.city.monthlyWeather[month].weatherComfort}/></div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">Nightlife gender: {selected.city.demographics.nightlifeGenderMix.male}% male · {selected.city.demographics.nightlifeGenderMix.female}% female · {selected.city.demographics.nightlifeGenderMix.unknown}% unknown</div>
      </aside> : null}
    </section>

    {activePulse ? <section className="mx-auto mt-6 max-w-7xl rounded-[2rem] border border-sky-200/20 bg-sky-200/[0.055] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-sky-200">Clickable stored pulse</p><h2 className="text-3xl font-black">{activePulse.city.name}: demand {activePulse.city.pulse.demandPressure}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{activePulse.city.pulse.explanation}</p></div><a href={`/cities/${activePulse.city.id}`} className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950">Open city page</a></div>
      <div className="mt-4 grid gap-3 md:grid-cols-4"><Metric label="Articles" value={activePulse.city.pulse.articleCount}/><Metric label="Momentum" value={activePulse.city.pulse.eventMomentum}/><Metric label="Risk" value={activePulse.city.pulse.riskScore}/><Metric label="Demand" value={activePulse.city.pulse.demandPressure}/></div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">{activePulse.city.pulse.headlines.map((headline)=><div key={headline} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-200">{headline}</div>)}</div>
    </section> : null}

    <footer className="fixed bottom-2 left-1/2 z-40 flex w-[min(1050px,calc(100vw-1rem))] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-full border border-white/10 bg-slate-950/85 px-2 py-1.5 text-xs font-black text-slate-300 backdrop-blur-xl"><span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5">{visible.length} visible</span><span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5">Top: {visible[0]?.city.name ?? "none"}</span><span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5">Passport: {passport}</span><span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5">Gender: {genderMode}</span><span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5">Audit: {auditComplete}/100</span><button className="shrink-0 rounded-full bg-sky-200 px-3 py-1.5 text-slate-950" onClick={()=>visible[0] && setSelectedId(visible[0].city.id)}>Select top match</button></footer>
  </main>;
}

function Slider({label,value,min,max,step,state,setState}:{label:string;value:string;min:number;max:number;step:number;state:number;setState:(n:number)=>void}){return <label className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="mb-2 flex justify-between text-sm font-black"><span>{label}</span><span>{value}</span></div><input className="w-full" type="range" min={min} max={max} step={step} value={state} onChange={(event)=>setState(Number(event.target.value))}/></label>}
function ChipGroup<T extends string>({title,items,active,onClick}:{title:string;items:Array<{label:string;value:T}>;active:T[];onClick:(v:T)=>void}){return <div className="mt-4"><div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{title}</div><div className="flex flex-wrap gap-2">{items.map((item)=><button key={item.value} onClick={()=>onClick(item.value)} className={`rounded-full px-3 py-2 text-xs font-black ${active.includes(item.value)?"bg-sky-200 text-slate-950":"border border-white/10 text-slate-300"}`}>{item.label}</button>)}</div></div>}
function Mini({label,value}:{label:string;value:number}){return <div><div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"><span>{label}</span><span>{value}</span></div><div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-200" style={{width:`${Math.max(0, Math.min(100, value))}%`}}/></div></div>}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="text-3xl font-black">{value}</div></div>}
