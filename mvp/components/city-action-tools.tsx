"use client";

import { useMemo, useState } from "react";
import type { CityIntelligence, MonthName } from "@/lib/city-intelligence";
import { passportFit, type PassportProfile } from "@/lib/passport";

const months: MonthName[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const passports: Array<{ label: string; value: PassportProfile }> = [
  { label: "Any passport", value: "any" },
  { label: "EU", value: "eu" },
  { label: "UK", value: "uk" },
  { label: "US/Canada", value: "us-canada" },
  { label: "Turkish", value: "turkish" },
  { label: "Visa flexible", value: "visa-flexible" }
];
const identities = ["locals", "tourists", "students", "remoteWorkers"] as const;
type Identity = typeof identities[number];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function CityActionTools({ city }: { city: CityIntelligence }) {
  const [month, setMonth] = useState<MonthName>("July");
  const [nights, setNights] = useState(5);
  const [budget, setBudget] = useState(700);
  const [passport, setPassport] = useState<PassportProfile>("any");
  const [identity, setIdentity] = useState<Identity>("tourists");
  const [saveMessage, setSaveMessage] = useState("");

  const weather = city.monthlyWeather[month];
  const passportResult = passportFit(city, passport);
  const estimatedCost = Math.round(city.average_daily_cost * nights);
  const budgetFit = clamp(100 - Math.max(0, estimatedCost - budget) / 8);
  const identityVenues = city.identityVenueCounts[identity];

  const plan = useMemo(() => {
    const morning = weather.weatherComfort >= 75 ? city.visuals.nature : city.visuals.architecture;
    const evening = identity === "students" ? "student-heavy social route" : identity === "locals" ? "local bar/cafe route" : identity === "remoteWorkers" ? "coworking-to-cafe route" : "tourist/international social route";
    const nightlifeMode = weather.outdoorNightlifeScore >= 80 ? "outdoor nightlife first" : "indoor bars and late cafes first";
    return [
      { label: "Morning", value: morning, score: weather.weatherComfort },
      { label: "Afternoon", value: `${city.visuals.architecture} + ${city.venues.restaurants} restaurant-surface estimate`, score: city.history_score },
      { label: "Evening", value: `${evening}: ${identityVenues.cafes} cafes, ${identityVenues.restaurants} restaurants`, score: city.social_density_score },
      { label: "Night", value: `${nightlifeMode}: ${identityVenues.bars} bars, ${identityVenues.clubs} clubs`, score: weather.outdoorNightlifeScore }
    ];
  }, [city, weather, identity, identityVenues]);

  const matchScore = clamp(
    weather.weatherComfort * 0.22 +
    weather.outdoorNightlifeScore * 0.2 +
    city.pulse.demandPressure * 0.16 +
    city.venues.densityScore * 0.16 +
    city.demographics.genderBalanceScore * 0.1 +
    passportResult.score * 0.1 +
    budgetFit * 0.06
  );

  async function saveTrip() {
    const response = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${city.name}, ${city.country}`,
        cityId: city.id,
        month,
        budgetLevel: budget <= 700 ? "Low" : budget <= 1200 ? "Medium" : "High",
        goal: `${identity}-city-page-plan`,
        computedScore: matchScore,
        notes: `Saved from city detail page. Month ${month}. Nights ${nights}. Budget €${budget}. Passport ${passport}: ${passportResult.label}. Identity route ${identity}. Weather ${weather.weatherComfort}. Pulse ${city.pulse.demandPressure}.`
      })
    });
    const json = await response.json();
    setSaveMessage(json?.data?.message ?? "Trip saved.");
  }

  return <section className="rounded-[2rem] border border-sky-200/20 bg-sky-200/[0.055] p-5 backdrop-blur-xl">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">Interactive city tools</p>
        <h2 className="mt-1 text-2xl font-black">Build a usable plan for {city.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Choose month, budget, passport, and target identity. The plan updates from stored weather, pulse, venues, gender, tourism, and passport logic.</p>
      </div>
      <div className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950">Match {matchScore}/100</div>
    </div>

    <div className="mt-5 grid gap-3 md:grid-cols-4">
      <label className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Month</span><select className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={month} onChange={(event)=>setMonth(event.target.value as MonthName)}>{months.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Passport</span><select className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={passport} onChange={(event)=>setPassport(event.target.value as PassportProfile)}>{passports.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Target identity</span><select className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={identity} onChange={(event)=>setIdentity(event.target.value as Identity)}>{identities.map((item)=><option key={item} value={item}>{item}</option>)}</select></label>
      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Passport fit</div><div className="mt-2 text-2xl font-black">{passportResult.score}/100</div><p className="text-xs text-slate-400">{passportResult.label}</p></div>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <Slider label="Nights" value={`${nights}`} min={2} max={30} state={nights} setState={setNights}/>
      <Slider label="Budget" value={`€${budget}`} min={300} max={2500} step={50} state={budget} setState={setBudget}/>
    </div>

    <div className="mt-5 grid gap-3 md:grid-cols-4">
      <Metric label="Estimated cost" value={`€${estimatedCost}`} />
      <Metric label="Budget fit" value={`${budgetFit}`} />
      <Metric label="Weather" value={`${weather.weatherComfort}`} />
      <Metric label="Pulse" value={`${city.pulse.demandPressure}`} />
    </div>

    <div className="mt-5 grid gap-3 md:grid-cols-4">
      {plan.map((block) => <div key={block.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <div className="text-xs font-black uppercase tracking-[0.14em] text-sky-200">{block.label}</div>
        <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-300">{block.value}</p>
        <div className="mt-3 text-2xl font-black">{block.score}</div>
      </div>)}
    </div>

    <div className="mt-5 flex flex-wrap gap-2">
      <button onClick={saveTrip} className="rounded-full bg-emerald-200 px-4 py-2 text-sm font-black text-slate-950">Save this plan</button>
      <a href="/trips" className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-slate-300">Open saved trips</a>
      <a href={`/api/city-intelligence?id=${city.id}`} className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-slate-300">Open city JSON</a>
    </div>
    {saveMessage ? <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{saveMessage}</div> : null}
  </section>;
}

function Slider({ label, value, min, max, step = 1, state, setState }: { label: string; value: string; min: number; max: number; step?: number; state: number; setState: (value: number) => void }) {
  return <label className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="mb-2 flex justify-between text-sm font-black"><span>{label}</span><span>{value}</span></div><input className="w-full" type="range" min={min} max={max} step={step} value={state} onChange={(event)=>setState(Number(event.target.value))}/></label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="mt-1 text-2xl font-black">{value}</div></div>;
}
