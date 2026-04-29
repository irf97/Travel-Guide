"use client";

import { useMemo, useState } from "react";
import { continents, type Continent } from "@/lib/world-data";
import { getAllCityIntelligence, type CityIntelligence, type MonthName } from "@/lib/city-intelligence";
import { passportFit, type PassportProfile } from "@/lib/passport";

type GenderMode = "any" | "balanced" | "female-leaning" | "male-leaning" | "nightlife-balanced";
type SortMode = "overall" | "cheapest" | "passport" | "pulse" | "nightlife" | "gender" | "nationality" | "tourism" | "weather" | "venues" | "confidence";

type RankedCity = {
  city: CityIntelligence;
  rankScore: number;
  estimatedCost: number;
  passportScore: number;
  passportLabel: string;
  nationalityShare: number;
  weatherScore: number;
  confidenceScore: number;
};

const months: MonthName[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const passports: Array<{ label: string; value: PassportProfile }> = [
  { label: "Any passport", value: "any" },
  { label: "EU", value: "eu" },
  { label: "UK", value: "uk" },
  { label: "US/Canada", value: "us-canada" },
  { label: "Turkish", value: "turkish" },
  { label: "Visa flexible", value: "visa-flexible" }
];
const genderModes: Array<{ label: string; value: GenderMode }> = [
  { label: "Any gender mix", value: "any" },
  { label: "Balanced", value: "balanced" },
  { label: "Female-leaning", value: "female-leaning" },
  { label: "Male-leaning", value: "male-leaning" },
  { label: "Nightlife balanced", value: "nightlife-balanced" }
];
const sortModes: Array<{ label: string; value: SortMode }> = [
  { label: "Overall", value: "overall" },
  { label: "Cheapest", value: "cheapest" },
  { label: "Passport fit", value: "passport" },
  { label: "Pulse", value: "pulse" },
  { label: "Nightlife", value: "nightlife" },
  { label: "Gender balance", value: "gender" },
  { label: "Selected nationality", value: "nationality" },
  { label: "Tourism", value: "tourism" },
  { label: "Weather", value: "weather" },
  { label: "Venue density", value: "venues" },
  { label: "Confidence", value: "confidence" }
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function nationalityShare(city: CityIntelligence, nationality: string) {
  if (nationality === "All") return 0;
  return city.demographics.touristNationalityMix.find((item) => item.label === nationality)?.share ?? 0;
}

function genderPass(city: CityIntelligence, mode: GenderMode) {
  const nightlife = city.demographics.nightlifeGenderMix;
  if (mode === "any") return true;
  if (mode === "balanced") return city.demographics.genderBalanceScore >= 88;
  if (mode === "female-leaning") return nightlife.female >= 45;
  if (mode === "male-leaning") return nightlife.male >= 54;
  return Math.abs(nightlife.male - nightlife.female) <= 10;
}

function rankCity(city: CityIntelligence, input: { month: MonthName; nights: number; budget: number; passport: PassportProfile; nationality: string }): RankedCity {
  const weather = city.monthlyWeather[input.month];
  const passport = passportFit(city, input.passport);
  const selectedNationalityShare = nationalityShare(city, input.nationality);
  const estimatedCost = Math.round(city.average_daily_cost * input.nights);
  const affordability = clamp(100 - Math.max(0, estimatedCost - input.budget) / 12);
  const confidenceScore = clamp(
    city.demographics.confidenceScore * 0.3 +
    city.venues.densityScore * 0.2 +
    weather.weatherComfort * 0.2 +
    city.tourism.cityTourismDemandScore * 0.15 +
    (city.pulse.confidence === "medium" ? 70 : 55) * 0.15
  );
  const rankScore = clamp(
    city.nightlife_score * 0.13 +
    city.history_score * 0.08 +
    city.food_culture_score * 0.08 +
    city.social_density_score * 0.1 +
    affordability * 0.1 +
    weather.weatherComfort * 0.11 +
    city.venues.densityScore * 0.11 +
    city.tourism.cityTourismDemandScore * 0.1 +
    city.demographics.genderBalanceScore * 0.07 +
    passport.score * 0.07 +
    city.pulse.demandPressure * 0.05 +
    selectedNationalityShare * 0.18
  );
  return { city, rankScore, estimatedCost, passportScore: passport.score, passportLabel: passport.label, nationalityShare: selectedNationalityShare, weatherScore: weather.weatherComfort, confidenceScore };
}

export function RankingsControlCenter() {
  const cities = useMemo(() => getAllCityIntelligence(), []);
  const countries = useMemo(() => ["All", ...Array.from(new Set(cities.map((city) => city.country))).sort()], [cities]);
  const nationalityOptions = useMemo(() => ["All", ...Array.from(new Set(cities.flatMap((city) => city.demographics.touristNationalityMix.map((item) => item.label)))).sort()], [cities]);
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState<Continent | "All">("All");
  const [country, setCountry] = useState("All");
  const [nationality, setNationality] = useState("All");
  const [month, setMonth] = useState<MonthName>("July");
  const [passport, setPassport] = useState<PassportProfile>("any");
  const [genderMode, setGenderMode] = useState<GenderMode>("any");
  const [sortMode, setSortMode] = useState<SortMode>("overall");
  const [budget, setBudget] = useState(1000);
  const [nights, setNights] = useState(14);
  const [selectedId, setSelectedId] = useState("barcelona-spain");
  const [expandedPulseId, setExpandedPulseId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = cities
      .filter((city) => continent === "All" || city.continent === continent)
      .filter((city) => country === "All" || city.country === country)
      .filter((city) => nationality === "All" || nationalityShare(city, nationality) > 0)
      .filter((city) => genderPass(city, genderMode))
      .filter((city) => !q || `${city.name} ${city.country} ${city.continent} ${city.best_neighborhoods.join(" ")} ${city.demographics.touristNationalityMix.map((item) => item.label).join(" ")}`.toLowerCase().includes(q))
      .map((city) => rankCity(city, { month, nights, budget, passport, nationality }));

    return rows.sort((a, b) => {
      if (sortMode === "cheapest") return a.estimatedCost - b.estimatedCost;
      if (sortMode === "passport") return b.passportScore - a.passportScore;
      if (sortMode === "pulse") return b.city.pulse.demandPressure - a.city.pulse.demandPressure;
      if (sortMode === "nightlife") return b.city.nightlife_score - a.city.nightlife_score;
      if (sortMode === "gender") return b.city.demographics.genderBalanceScore - a.city.demographics.genderBalanceScore;
      if (sortMode === "nationality") return b.nationalityShare - a.nationalityShare;
      if (sortMode === "tourism") return b.city.tourism.cityTourismDemandScore - a.city.tourism.cityTourismDemandScore;
      if (sortMode === "weather") return b.weatherScore - a.weatherScore;
      if (sortMode === "venues") return b.city.venues.densityScore - a.city.venues.densityScore;
      if (sortMode === "confidence") return b.confidenceScore - a.confidenceScore;
      return b.rankScore - a.rankScore;
    });
  }, [cities, continent, country, nationality, genderMode, query, month, nights, budget, passport, sortMode]);

  const selected = ranked.find((row) => row.city.id === selectedId) ?? ranked[0];
  const top100Complete = cities.slice(0, 100).filter((city) => city.visuals?.slides?.length >= 5 && city.pulse?.headlines?.length && city.demographics?.touristNationalityMix?.length && city.demographics?.nightlifeGenderMix && city.venues?.bars && city.identityVenueCounts?.locals && city.monthlyWeather?.July && city.tourism?.cityTourismDemandScore).length;

  async function save(row: RankedCity) {
    const response = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${row.city.name}, ${row.city.country}`,
        cityId: row.city.id,
        month,
        budgetLevel: budget <= 800 ? "Low" : budget <= 1300 ? "Medium" : "High",
        goal: `rankings-${nationality}-${genderMode}`,
        computedScore: row.rankScore,
        notes: `Saved from rankings. Passport ${passport}: ${row.passportLabel}. Gender ${genderMode}. Nationality ${nationality}: ${row.nationalityShare}%. Pulse ${row.city.pulse.demandPressure}.`
      })
    });
    const json = await response.json();
    setSaveMessage(json?.data?.message ?? "Saved.");
  }

  return <main className="min-h-screen px-4 py-10 text-white">
    <section className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Stored city intelligence</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] md:text-6xl">City rankings control center</h1>
          <p className="mt-4 max-w-3xl text-slate-300">Passport, gender, nationality, pulse, visuals, venues, tourism, monthly weather, and city detail pages are connected to one stored intelligence layer.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-black">
          <a className="rounded-full border border-white/10 px-4 py-2 text-slate-300" href="/demographics">Demographics</a>
          <a className="rounded-full border border-white/10 px-4 py-2 text-slate-300" href="/qa">QA</a>
          <a className="rounded-full bg-sky-200 px-4 py-2 text-slate-950" href="/trips">Trips</a>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <input className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city, country, nationality" />
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={continent} onChange={(event) => setContinent(event.target.value as Continent | "All")}><option>All</option>{continents.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={country} onChange={(event) => setCountry(event.target.value)}>{countries.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={nationality} onChange={(event) => setNationality(event.target.value)}>{nationalityOptions.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>{sortModes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={passport} onChange={(event) => setPassport(event.target.value as PassportProfile)}>{passports.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={genderMode} onChange={(event) => setGenderMode(event.target.value as GenderMode)}>{genderModes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={month} onChange={(event) => setMonth(event.target.value as MonthName)}>{months.map((item) => <option key={item}>{item}</option>)}</select>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Slider label="Budget" value={`€${budget}`} min={500} max={2500} step={50} state={budget} setState={setBudget} />
        <Slider label="Stay length" value={`${nights} nights`} min={3} max={30} step={1} state={nights} setState={setNights} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
        <span>{ranked.length} matching cities.</span>
        <span>Top-100 completeness: {top100Complete}/100.</span>
        <span>Nationality filter: {nationality}.</span>
        <a className="font-black underline" href={`/api/rankings?nationality=${encodeURIComponent(nationality)}&passport=${passport}&gender=${genderMode}&top=25`}>Open matching JSON</a>
      </div>
      {saveMessage ? <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{saveMessage}</div> : null}
    </section>

    <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-[1.45fr_.85fr]">
      <div className="grid gap-3">
        {ranked.slice(0, 100).map((row, index) => <article key={row.city.id} className={`rounded-[1.5rem] border p-4 backdrop-blur-xl ${selected?.city.id === row.city.id ? "border-sky-200 bg-sky-200/10" : "border-white/10 bg-white/[0.04]"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <button onClick={() => setSelectedId(row.city.id)} className="text-left">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">#{index + 1} · {row.city.country} · {row.passportLabel}</div>
              <h2 className="mt-1 text-2xl font-black">{row.city.visuals.flag} {row.city.name}</h2>
              <p className="mt-1 text-sm text-slate-400">€{row.estimatedCost} · {month} · pulse {row.city.pulse.demandPressure} · {nationality === "All" ? "all nationalities" : `${nationality} ${row.nationalityShare}%`}</p>
            </button>
            <div className="flex flex-wrap gap-2"><a className="rounded-full border border-white/10 px-3 py-2 text-xs font-black text-slate-300" href={`/cities/${row.city.id}`}>City page</a><button onClick={() => save(row)} className="rounded-full border border-emerald-200/30 px-3 py-2 text-xs font-black text-emerald-100">Save</button><div className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950">{row.rankScore}/100</div></div>
          </div>
          <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-1">{row.city.visuals.slides.map((slide) => <div key={slide.kind} className="min-w-[130px] snap-start rounded-2xl border border-white/10 bg-slate-950/55 p-3"><div className="text-3xl">{slide.label}</div><div className="mt-2 text-[11px] font-black text-white">{slide.title}</div><div className="text-[10px] text-slate-500">{slide.caption}</div></div>)}</div>
          <div className="mt-4 grid gap-2 md:grid-cols-8"><Mini label="Passport" value={row.passportScore} /><Mini label="Weather" value={row.weatherScore} /><Mini label="Venues" value={row.city.venues.densityScore} /><Mini label="Pulse" value={row.city.pulse.demandPressure} /><Mini label="Nightlife" value={row.city.nightlife_score} /><Mini label="Gender" value={row.city.demographics.genderBalanceScore} /><Mini label={nationality === "All" ? "Intl" : nationality} value={nationality === "All" ? row.city.tourism.internationalTouristPressure : row.nationalityShare} /><Mini label="Conf." value={row.confidenceScore} /></div>
          <button onClick={() => setExpandedPulseId(expandedPulseId === row.city.id ? null : row.city.id)} className="mt-4 rounded-full border border-white/10 px-3 py-2 text-xs font-black text-sky-200 hover:bg-white/10">{expandedPulseId === row.city.id ? "Hide pulse" : "Open stored pulse"}</button>
          {expandedPulseId === row.city.id ? <div className="mt-3 rounded-2xl border border-sky-200/20 bg-sky-200/10 p-4 text-sm text-slate-200"><div className="grid gap-2 md:grid-cols-4"><Metric label="Articles" value={row.city.pulse.articleCount} /><Metric label="Momentum" value={row.city.pulse.eventMomentum} /><Metric label="Risk" value={row.city.pulse.riskScore} /><Metric label="Demand" value={row.city.pulse.demandPressure} /></div><p className="mt-3 text-slate-300">{row.city.pulse.explanation}</p></div> : null}
        </article>)}
      </div>

      {selected ? <aside className="sticky top-4 h-fit rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <h2 className="text-3xl font-black">{selected.city.visuals.flag} {selected.city.name}</h2>
        <p className="text-sm text-slate-400">{selected.city.country} · {selected.city.continent} · {selected.passportLabel}</p>
        <div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Score" value={selected.rankScore} /><Metric label="Passport" value={selected.passportScore} /><Metric label="Pulse" value={selected.city.pulse.demandPressure} /><Metric label="Gender" value={selected.city.demographics.genderBalanceScore} /></div>
        <div className="mt-4 flex gap-2"><button onClick={() => save(selected)} className="flex-1 rounded-full bg-emerald-200 px-4 py-3 text-sm font-black text-slate-950">Save city</button><a href={`/cities/${selected.city.id}`} className="rounded-full border border-white/10 px-4 py-3 text-sm font-black text-slate-200">Open city</a></div>
        <h3 className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-sky-200">Tourist nationality mix</h3>
        <div className="mt-2 grid gap-2">{selected.city.demographics.touristNationalityMix.map((item) => <button key={item.label} onClick={() => setNationality(item.label)} className={`rounded-2xl border p-3 text-left ${item.label === nationality ? "border-sky-200 bg-sky-200/10" : "border-white/10 bg-slate-950/50"}`}><div className="flex justify-between text-sm"><span>{item.label}</span><b>{item.share}%</b></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-200" style={{ width: `${Math.max(3, item.share)}%` }} /></div></button>)}</div>
        <h3 className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-sky-200">Gender mix</h3>
        <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">Nightlife: {selected.city.demographics.nightlifeGenderMix.male}% male · {selected.city.demographics.nightlifeGenderMix.female}% female · {selected.city.demographics.nightlifeGenderMix.unknown}% unknown<br />General: {selected.city.demographics.generalGenderMix.male}% male · {selected.city.demographics.generalGenderMix.female}% female</div>
      </aside> : null}
    </section>
  </main>;
}

function Slider({ label, value, min, max, step, state, setState }: { label: string; value: string; min: number; max: number; step: number; state: number; setState: (value: number) => void }) {
  return <label className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="mb-2 flex justify-between text-sm font-black"><span>{label}</span><span>{value}</span></div><input className="w-full" type="range" min={min} max={max} step={step} value={state} onChange={(event) => setState(Number(event.target.value))} /></label>;
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div><div className="mb-1 flex justify-between text-[10px] font-black uppercase text-slate-400"><span>{label}</span><span>{value}</span></div><div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-200" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="text-2xl font-black">{value}</div></div>;
}
