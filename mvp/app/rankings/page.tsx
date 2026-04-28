"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { continents, type Continent } from "@/lib/world-data";
import { getAllCityIntelligence, type CityIntelligence, type MonthName } from "@/lib/city-intelligence";
import { passportFit, type PassportProfile } from "@/lib/passport";
import type { AvoidKey, FeatureKey, TravelStyle } from "@/lib/types";

const monthOptions: MonthName[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const travelStyles: Array<{ label: string; value: TravelStyle }> = [
  { label: "Balanced", value: "balanced" }, { label: "Social", value: "social" }, { label: "Nightlife", value: "nightlife" }, { label: "Culture", value: "culture" }, { label: "Food", value: "food" }, { label: "Budget", value: "budget" }, { label: "Remote", value: "remote-work" }
];
const features: Array<{ label: string; value: FeatureKey }> = [
  { label: "Nightlife", value: "bars" }, { label: "Clubs", value: "clubs" }, { label: "Food", value: "local_food" }, { label: "Historic", value: "historic" }, { label: "Sea", value: "sea" }, { label: "International", value: "international_crowd" }, { label: "Young adults", value: "young_adults" }, { label: "Coworking", value: "coworking" }
];
const avoidances: Array<{ label: string; value: AvoidKey }> = [
  { label: "Too Crowded", value: "too_crowded" }, { label: "Tourist Traps", value: "tourist_traps" }, { label: "Expensive", value: "expensive" }, { label: "Car Dependent", value: "car_dependent" }, { label: "Dead Nightlife", value: "dead_nightlife" }
];
const passportOptions: Array<{ label: string; value: PassportProfile }> = [
  { label: "Any passport", value: "any" }, { label: "EU", value: "eu" }, { label: "UK", value: "uk" }, { label: "US/Canada", value: "us-canada" }, { label: "Turkish", value: "turkish" }, { label: "Visa flexible", value: "visa-flexible" }
];
const genderOptions = ["any", "balanced", "female-leaning", "male-leaning", "nightlife-balanced"] as const;
type GenderMode = typeof genderOptions[number];
const sortModes = ["overall", "cheapest", "passport-fit", "pulse", "nightlife", "history", "international", "gender-balance", "tourism-demand", "tourism-index", "weather", "venue-density", "confidence"] as const;
type SortMode = typeof sortModes[number];

type Ranked = {
  city: CityIntelligence;
  score: number;
  cost: number;
  selectedWeather: CityIntelligence["monthlyWeather"][MonthName];
  featureFit: number;
  riskPenalty: number;
  confidenceScore: number;
  passportScore: number;
  passportLabel: string;
};

function toggle<T extends string>(list: T[], value: T) { return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }

function featureFit(city: CityIntelligence, wanted: FeatureKey[]) {
  if (!wanted.length) return 70;
  let score = 0;
  for (const item of wanted) {
    if (item === "bars") score += city.venues.bars > 100 ? 14 : city.nightlife_score / 8;
    if (item === "clubs") score += city.venues.clubs > 10 ? 14 : city.venues.clubs;
    if (item === "local_food") score += city.food_culture_score / 7;
    if (item === "historic") score += city.history_score / 7;
    if (item === "sea") score += city.sea_access ? 14 : 2;
    if (item === "international_crowd") score += city.tourism.internationalTouristPressure / 7;
    if (item === "young_adults") score += city.social_density_score / 7;
    if (item === "coworking") score += city.venues.coworking > 6 ? 12 : city.venues.coworking * 1.5;
  }
  return clamp((score / wanted.length) * 7.2);
}

function riskPenalty(city: CityIntelligence, avoid: AvoidKey[], budget: number) {
  let penalty = 0;
  if (avoid.includes("too_crowded")) penalty += city.tourism.cityTourismDemandScore > 82 ? 10 : 2;
  if (avoid.includes("tourist_traps")) penalty += city.tourism.tourismNightsIndex > 86 && city.demographics.touristVisitorShare > 28 ? 10 : 2;
  if (avoid.includes("expensive")) penalty += city.base_cost_per_person > budget ? 12 : 0;
  if (avoid.includes("car_dependent")) penalty += city.mobility_score < 70 ? 9 : 1;
  if (avoid.includes("dead_nightlife")) penalty += city.nightlife_score < 72 ? 12 : 0;
  return clamp(penalty);
}

function styleScore(city: CityIntelligence, styles: TravelStyle[], weather: Ranked["selectedWeather"]) {
  const active = styles.length ? styles : ["balanced"];
  let score = 0;
  for (const style of active) {
    if (style === "balanced") score += (city.nightlife_score + city.history_score + city.food_culture_score + city.mobility_score + weather.weatherComfort) / 5;
    if (style === "social") score += city.social_density_score * 0.55 + city.tourism.internationalTouristPressure * 0.25 + city.venues.socialSurfaceArea * 0.2;
    if (style === "nightlife") score += city.nightlife_score * 0.5 + weather.outdoorNightlifeScore * 0.25 + city.venues.clubs * 1.1;
    if (style === "culture") score += city.history_score * 0.72 + city.venues.museums * 0.9 + city.venues.historicSites * 0.7;
    if (style === "food") score += city.food_culture_score * 0.74 + city.venues.restaurants * 0.08 + city.venues.cafes * 0.08;
    if (style === "budget") score += clamp(100 - Math.max(0, city.base_cost_per_person - 600) / 13);
    if (style === "remote-work") score += city.mobility_score * 0.46 + city.venues.coworking * 2.8 + weather.weatherComfort * 0.2;
  }
  return clamp(score / active.length);
}

function genderPass(city: CityIntelligence, mode: GenderMode) {
  const night = city.demographics.nightlifeGenderMix;
  if (mode === "any") return true;
  if (mode === "balanced") return city.demographics.genderBalanceScore >= 88;
  if (mode === "female-leaning") return night.female >= 45;
  if (mode === "male-leaning") return night.male >= 54;
  return Math.abs(night.male - night.female) <= 10;
}

function rankCity(city: CityIntelligence, input: { month: MonthName; budget: number; nights: number; styles: TravelStyle[]; wanted: FeatureKey[]; avoid: AvoidKey[]; passport: PassportProfile }): Ranked {
  const selectedWeather = city.monthlyWeather[input.month];
  const cost = Math.round(city.average_daily_cost * input.nights);
  const affordability = clamp(100 - Math.max(0, cost - input.budget) / 13);
  const fit = featureFit(city, input.wanted);
  const penalty = riskPenalty(city, input.avoid, input.budget);
  const style = styleScore(city, input.styles, selectedWeather);
  const passport = passportFit(city, input.passport);
  const confidenceScore = clamp(city.demographics.confidenceScore * 0.28 + (city.tourism.confidence === "high" ? 86 : city.tourism.confidence === "medium" ? 68 : 45) * 0.25 + selectedWeather.weatherComfort * 0.15 + city.venues.densityScore * 0.18 + city.pulse.confidence === "medium" ? 8 : 4);
  const score = clamp(
    style * 0.19 +
    fit * 0.14 +
    affordability * 0.12 +
    selectedWeather.weatherComfort * 0.12 +
    city.tourism.cityTourismDemandScore * 0.11 +
    city.venues.densityScore * 0.11 +
    city.demographics.genderBalanceScore * 0.07 +
    passport.score * 0.08 +
    city.pulse.demandPressure * 0.06 +
    confidenceScore * 0.04 -
    penalty * 0.55
  );
  return { city, score, cost, selectedWeather, featureFit: fit, riskPenalty: penalty, confidenceScore, passportScore: passport.score, passportLabel: passport.label };
}

function auditCity(city: CityIntelligence) {
  const missing = [
    city.visuals?.flag ? null : "flag",
    city.visuals?.slides?.length >= 5 ? null : "visual slides",
    city.pulse?.headlines?.length ? null : "pulse",
    city.demographics?.touristNationalityMix?.length ? null : "nationality mix",
    city.demographics?.nightlifeGenderMix ? null : "gender mix",
    city.venues?.bars ? null : "venue counts",
    city.identityVenueCounts?.locals ? null : "identity venue split",
    city.monthlyWeather?.July ? null : "monthly weather",
    city.tourism?.cityTourismDemandScore ? null : "tourism score"
  ].filter(Boolean) as string[];
  return { cityId: city.id, name: city.name, missing, complete: missing.length === 0 };
}

export default function RankingsPage() {
  const allCities = useMemo(() => getAllCityIntelligence(), []);
  const countries = useMemo(() => [...new Set(allCities.map((city) => city.country))].sort(), [allCities]);
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState<Continent | "All">("All");
  const [country, setCountry] = useState("All");
  const [budget, setBudget] = useState(1000);
  const [nights, setNights] = useState(14);
  const [month, setMonth] = useState<MonthName>("July");
  const [passport, setPassport] = useState<PassportProfile>("any");
  const [genderMode, setGenderMode] = useState<GenderMode>("any");
  const [styles, setStyles] = useState<TravelStyle[]>(["social", "culture", "food"]);
  const [wanted, setWanted] = useState<FeatureKey[]>(["bars", "local_food", "historic", "international_crowd", "young_adults"]);
  const [avoid, setAvoid] = useState<AvoidKey[]>(["car_dependent"]);
  const [sortMode, setSortMode] = useState<SortMode>("overall");
  const [selectedId, setSelectedId] = useState("barcelona-spain");
  const [expandedPulseId, setExpandedPulseId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  const audit = useMemo(() => allCities.slice(0, 100).map(auditCity), [allCities]);
  const auditComplete = audit.filter((item) => item.complete).length;

  const ranked = useMemo<Ranked[]>(() => {
    const q = query.toLowerCase().trim();
    const rows = allCities
      .filter((city) => continent === "All" || city.continent === continent)
      .filter((city) => country === "All" || city.country === country)
      .filter((city) => genderPass(city, genderMode))
      .filter((city) => !q || `${city.name} ${city.country} ${city.continent} ${city.types.join(" ")} ${city.best_neighborhoods.join(" ")} ${city.nationality_mix_context}`.toLowerCase().includes(q))
      .map((city) => rankCity(city, { month, budget, nights, styles, wanted, avoid, passport }));

    return rows.sort((a, b) => {
      if (sortMode === "cheapest") return a.cost - b.cost;
      if (sortMode === "passport-fit") return b.passportScore - a.passportScore;
      if (sortMode === "pulse") return b.city.pulse.demandPressure - a.city.pulse.demandPressure;
      if (sortMode === "nightlife") return b.city.nightlife_score - a.city.nightlife_score;
      if (sortMode === "history") return b.city.history_score - a.city.history_score;
      if (sortMode === "international") return b.city.tourism.internationalTouristPressure - a.city.tourism.internationalTouristPressure;
      if (sortMode === "gender-balance") return b.city.demographics.genderBalanceScore - a.city.demographics.genderBalanceScore;
      if (sortMode === "tourism-demand") return b.city.tourism.cityTourismDemandScore - a.city.tourism.cityTourismDemandScore;
      if (sortMode === "tourism-index") return b.city.tourism.tourismNightsIndex - a.city.tourism.tourismNightsIndex;
      if (sortMode === "weather") return b.selectedWeather.weatherComfort - a.selectedWeather.weatherComfort;
      if (sortMode === "venue-density") return b.city.venues.densityScore - a.city.venues.densityScore;
      if (sortMode === "confidence") return b.confidenceScore - a.confidenceScore;
      return b.score - a.score;
    });
  }, [allCities, query, continent, country, month, budget, nights, styles, wanted, avoid, sortMode, passport, genderMode]);

  const selected = ranked.find((row) => row.city.id === selectedId) ?? ranked[0];

  async function save(row: Ranked) {
    const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `${row.city.name}, ${row.city.country}`, cityId: row.city.id, month, budgetLevel: budget <= 800 ? "Low" : budget <= 1300 ? "Medium" : "High", goal: styles.join("-") || "balanced", computedScore: row.score, notes: `Saved from /rankings. Passport ${passport}: ${row.passportLabel}. Gender filter ${genderMode}. Pulse demand ${row.city.pulse.demandPressure}. Weather ${row.selectedWeather.weatherComfort}. Venue density ${row.city.venues.densityScore}.` }) });
    const json = await response.json();
    setSaveMessage(json?.data?.message ?? "Saved.");
  }

  return <main className="min-h-screen px-4 py-10 text-white">
    <section className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Stored city intelligence</p><h1 className="mt-3 text-4xl font-black tracking-[-0.055em] md:text-6xl">City rankings control center</h1><p className="mt-4 max-w-3xl text-slate-300">Passport, gender balance, pulse, visuals, venues, tourism, monthly weather, and city detail pages are now connected to one stored intelligence layer.</p></div>
        <div className="flex gap-2"><Link className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-slate-300" href="/admin">Route console</Link><Link className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-slate-300" href="/world">World map</Link><Link className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950" href="/trips">Trips</Link></div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <input className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search city/country/neighborhood" />
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={continent} onChange={(e)=>setContinent(e.target.value as Continent | "All")}><option>All</option>{continents.map((c)=><option key={c}>{c}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={country} onChange={(e)=>setCountry(e.target.value)}><option>All</option>{countries.map((c)=><option key={c}>{c}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={sortMode} onChange={(e)=>setSortMode(e.target.value as SortMode)}>{sortModes.map((m)=><option key={m}>{m}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={passport} onChange={(e)=>setPassport(e.target.value as PassportProfile)}>{passportOptions.map((p)=><option key={p.value} value={p.value}>{p.label}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={genderMode} onChange={(e)=>setGenderMode(e.target.value as GenderMode)}>{genderOptions.map((m)=><option key={m}>{m}</option>)}</select>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><Slider label="Budget" value={`€${budget}`} min={500} max={2500} step={50} state={budget} setState={setBudget}/><Slider label="Stay length" value={`${nights} nights`} min={3} max={30} step={1} state={nights} setState={setNights}/></div>
      <ChipGroup title="Month" items={monthOptions.map((m)=>({label:m,value:m}))} active={[month]} onClick={(v)=>setMonth(v)}/>
      <ChipGroup title="Travel style" items={travelStyles} active={styles} onClick={(v)=>setStyles(toggle(styles, v))}/>
      <ChipGroup title="Desired features" items={features} active={wanted} onClick={(v)=>setWanted(toggle(wanted, v))}/>
      <ChipGroup title="Avoidances" items={avoidances} active={avoid} onClick={(v)=>setAvoid(toggle(avoid, v))}/>
      <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">Top-100 completeness audit: {auditComplete}/100 complete. {auditComplete < 100 ? `${100-auditComplete} need review.` : "All top-100 records have stored visuals, pulse, weather, venues, tourism, gender, and nationality metadata."}</div>
      {saveMessage ? <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{saveMessage}</div> : null}
    </section>

    <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-[1.5fr_.9fr]">
      <div className="grid gap-3">
        {ranked.slice(0, 100).map((row, index) => <article key={row.city.id} className={`rounded-[1.5rem] border p-4 backdrop-blur-xl transition ${selected?.city.id===row.city.id ? "border-sky-200 bg-sky-200/10" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3"><button onClick={()=>setSelectedId(row.city.id)} className="text-left"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">#{index+1} · {row.city.country} · {row.city.continent} · {row.passportLabel}</div><h2 className="mt-1 text-2xl font-black">{row.city.visuals.flag} {row.city.name}</h2><p className="mt-1 text-sm text-slate-400">€{row.cost} · {month} · {row.selectedWeather.avgTempC}°C avg · pulse {row.city.pulse.demandPressure}</p></button><div className="flex gap-2"><Link className="rounded-full border border-white/10 px-3 py-2 text-xs font-black text-slate-300" href={`/cities/${row.city.id}`}>City page</Link><div className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950">{row.score}/100</div></div></div>
          <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-1">{row.city.visuals.slides.map((slide)=><div key={slide.kind} className="min-w-[130px] snap-start rounded-2xl border border-white/10 bg-slate-950/55 p-3"><div className="text-3xl">{slide.label}</div><div className="mt-2 text-[11px] font-black text-white">{slide.title}</div><div className="text-[10px] text-slate-500">{slide.caption}</div></div>)}</div>
          <div className="mt-4 grid gap-2 md:grid-cols-8"><Mini label="Passport" value={row.passportScore}/><Mini label="Weather" value={row.selectedWeather.weatherComfort}/><Mini label="Venues" value={row.city.venues.densityScore}/><Mini label="Pulse" value={row.city.pulse.demandPressure}/><Mini label="Nightlife" value={row.city.nightlife_score}/><Mini label="Gender" value={row.city.demographics.genderBalanceScore}/><Mini label="Intl" value={row.city.tourism.internationalTouristPressure}/><Mini label="Conf." value={row.confidenceScore}/></div>
          <button onClick={()=>setExpandedPulseId(expandedPulseId === row.city.id ? null : row.city.id)} className="mt-4 rounded-full border border-white/10 px-3 py-2 text-xs font-black text-sky-200 hover:bg-white/10">{expandedPulseId === row.city.id ? "Hide pulse" : "Open stored pulse"}</button>
          {expandedPulseId === row.city.id ? <div className="mt-3 rounded-2xl border border-sky-200/20 bg-sky-200/10 p-4 text-sm text-slate-200"><div className="grid gap-2 md:grid-cols-4"><Metric label="Articles" value={`${row.city.pulse.articleCount}`}/><Metric label="Momentum" value={`${row.city.pulse.eventMomentum}`}/><Metric label="Risk" value={`${row.city.pulse.riskScore}`}/><Metric label="Demand" value={`${row.city.pulse.demandPressure}`}/></div><p className="mt-3 text-slate-300">{row.city.pulse.explanation}</p><div className="mt-3 grid gap-2">{row.city.pulse.headlines.map((headline)=><div key={headline} className="rounded-xl bg-white/[0.05] px-3 py-2">{headline}</div>)}</div></div> : null}
        </article>)}
      </div>
      {selected ? <aside className="sticky top-4 h-fit rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <h2 className="text-3xl font-black">{selected.city.visuals.flag} {selected.city.name}</h2><p className="text-sm text-slate-400">{selected.city.country} · {selected.city.continent} · {selected.passportLabel}</p>
        <div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Score" value={`${selected.score}`}/><Metric label="Passport" value={`${selected.passportScore}`}/><Metric label="Pulse" value={`${selected.city.pulse.demandPressure}`}/><Metric label="Gender" value={`${selected.city.demographics.genderBalanceScore}`}/></div>
        <div className="mt-4 flex gap-2"><button onClick={()=>save(selected)} className="flex-1 rounded-full bg-emerald-200 px-4 py-3 text-sm font-black text-slate-950">Save city</button><Link href={`/cities/${selected.city.id}`} className="rounded-full border border-white/10 px-4 py-3 text-sm font-black text-slate-200">Open city</Link></div>
        <h3 className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-sky-200">Identity venue counts</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-300">{Object.entries(selected.city.identityVenueCounts).filter(([key])=>key!=="note").map(([key,value]) => typeof value === "object" ? <div key={key} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="font-black capitalize text-sky-200">{key}</div><div className="mt-1 text-xs">Bars {value.bars}<br/>Clubs {value.clubs}<br/>Restaurants {value.restaurants}<br/>Cafes {value.cafes}</div></div> : null)}</div>
        <h3 className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-sky-200">Gender mix</h3>
        <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">Nightlife: {selected.city.demographics.nightlifeGenderMix.male}% male · {selected.city.demographics.nightlifeGenderMix.female}% female · {selected.city.demographics.nightlifeGenderMix.unknown}% unknown<br/>General: {selected.city.demographics.generalGenderMix.male}% male · {selected.city.demographics.generalGenderMix.female}% female</div>
        <h3 className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-sky-200">Tourist nationality mix</h3>
        <div className="mt-2 grid gap-2">{selected.city.demographics.touristNationalityMix.map((item)=><div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="flex justify-between text-sm"><span>{item.label}</span><b>{item.share}%</b></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-200" style={{width:`${item.share}%`}}/></div></div>)}</div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Sources: {selected.city.sourceConfidence.weather}; {selected.city.sourceConfidence.tourism}; {selected.city.sourceConfidence.venues}; {selected.city.sourceConfidence.pulse}; {selected.city.sourceConfidence.demographics}.</p>
      </aside> : null}
    </section>
  </main>;
}

function Slider({label,value,min,max,step,state,setState}:{label:string;value:string;min:number;max:number;step:number;state:number;setState:(n:number)=>void}){return <label className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="mb-2 flex justify-between text-sm font-black"><span>{label}</span><span>{value}</span></div><input className="w-full" type="range" min={min} max={max} step={step} value={state} onChange={(e)=>setState(Number(e.target.value))}/></label>}
function ChipGroup<T extends string>({title,items,active,onClick}:{title:string;items:Array<{label:string;value:T}>;active:T[];onClick:(v:T)=>void}){return <div className="mt-4"><div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{title}</div><div className="flex flex-wrap gap-2">{items.map((item)=><button key={item.value} onClick={()=>onClick(item.value)} className={`rounded-full px-3 py-2 text-xs font-black ${active.includes(item.value)?"bg-sky-200 text-slate-950":"border border-white/10 text-slate-300"}`}>{item.label}</button>)}</div></div>}
function Mini({label,value}:{label:string;value:number}){return <div><div className="mb-1 flex justify-between text-[10px] font-black uppercase text-slate-400"><span>{label}</span><span>{value}</span></div><div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-200" style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="text-2xl font-black">{value}</div></div>}
