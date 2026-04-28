"use client";

import { useMemo, useState } from "react";
import { getAllCityIntelligence, type MonthName } from "@/lib/city-intelligence";

const months: MonthName[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }

export default function ProductLabPage() {
  const cities = useMemo(() => getAllCityIntelligence(), []);
  const [a, setA] = useState("barcelona-spain");
  const [b, setB] = useState("lisbon-portugal");
  const [month, setMonth] = useState<MonthName>("July");
  const [budget, setBudget] = useState(1000);
  const [nightlifeWeight, setNightlifeWeight] = useState(35);
  const [cultureWeight, setCultureWeight] = useState(25);
  const [weatherWeight, setWeatherWeight] = useState(20);
  const [costWeight, setCostWeight] = useState(20);

  const cityA = cities.find((city) => city.id === a) ?? cities[0];
  const cityB = cities.find((city) => city.id === b) ?? cities[1];

  function score(city: typeof cityA) {
    const costScore = clamp(100 - Math.max(0, city.base_cost_per_person - budget) / 12);
    const totalWeight = nightlifeWeight + cultureWeight + weatherWeight + costWeight || 1;
    return clamp((city.nightlife_score * nightlifeWeight + city.history_score * cultureWeight + city.monthlyWeather[month].weatherComfort * weatherWeight + costScore * costWeight) / totalWeight);
  }

  const routeBlocks = useMemo(() => {
    const city = score(cityA) >= score(cityB) ? cityA : cityB;
    return [
      { time: "Morning", action: `${city.visuals.architecture} walk + low-pressure café start`, score: city.venues.cafes },
      { time: "Afternoon", action: `${city.visuals.nature} / cultural neighborhood exploration`, score: city.history_score },
      { time: "Evening", action: `Food quarter: ${city.venues.restaurants} restaurant-surface estimate`, score: city.food_culture_score },
      { time: "Night", action: `Social route: ${city.venues.bars} bars + ${city.venues.clubs} clubs, use pulse demand ${city.pulse.demandPressure}`, score: city.nightlife_score }
    ];
  }, [cityA, cityB, month, budget, nightlifeWeight, cultureWeight, weatherWeight, costWeight]);

  const winner = score(cityA) >= score(cityB) ? cityA : cityB;

  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 text-white">
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Functional product lab</p>
      <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">Decision tools, not placeholders.</h1>
      <p className="mt-4 max-w-3xl text-slate-300">Compare cities, tune weights, generate a route logic, and inspect stored intelligence tradeoffs. This page now uses the same city-intelligence layer as Rankings.</p>
      <div className="mt-5 flex gap-2"><a className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950" href="/rankings">Open rankings</a><a className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-slate-300" href={`/cities/${winner.id}`}>Open winner</a></div>
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <h2 className="text-2xl font-black">City comparison cockpit</h2>
        <div className="mt-4 grid gap-3">
          <Select label="City A" value={a} onChange={setA} options={cities.map((city)=>({label:`${city.visuals.flag} ${city.name}`, value:city.id}))}/>
          <Select label="City B" value={b} onChange={setB} options={cities.map((city)=>({label:`${city.visuals.flag} ${city.name}`, value:city.id}))}/>
          <Select label="Month" value={month} onChange={(v)=>setMonth(v as MonthName)} options={months.map((m)=>({label:m,value:m}))}/>
          <Slider label="Budget" value={`€${budget}`} valueNum={budget} min={500} max={2500} setValue={setBudget}/>
          <Slider label="Nightlife weight" value={`${nightlifeWeight}%`} valueNum={nightlifeWeight} min={0} max={60} setValue={setNightlifeWeight}/>
          <Slider label="Culture weight" value={`${cultureWeight}%`} valueNum={cultureWeight} min={0} max={60} setValue={setCultureWeight}/>
          <Slider label="Weather weight" value={`${weatherWeight}%`} valueNum={weatherWeight} min={0} max={60} setValue={setWeatherWeight}/>
          <Slider label="Cost weight" value={`${costWeight}%`} valueNum={costWeight} min={0} max={60} setValue={setCostWeight}/>
        </div>
      </div>

      <div className="grid gap-4">
        {[cityA, cityB].map((city) => <article key={city.id} className={`rounded-[2rem] border p-5 backdrop-blur-xl ${city.id === winner.id ? "border-emerald-200/40 bg-emerald-200/10" : "border-white/10 bg-white/[0.055]"}`}>
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-3xl font-black">{city.visuals.flag} {city.name}</h2><p className="text-sm text-slate-400">{city.country} · {month} · {city.monthlyWeather[month].avgTempC}°C avg</p></div><div className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950">{score(city)}/100</div></div>
          <div className="mt-4 grid gap-2 md:grid-cols-4"><Metric label="Nightlife" value={city.nightlife_score}/><Metric label="Culture" value={city.history_score}/><Metric label="Weather" value={city.monthlyWeather[month].weatherComfort}/><Metric label="Pulse" value={city.pulse.demandPressure}/></div>
        </article>)}
      </div>
    </section>

    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <h2 className="text-2xl font-black">Generated social route logic for {winner.name}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">{routeBlocks.map((block)=><div key={block.time} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.14em] text-sky-200">{block.time}</div><p className="mt-2 text-sm leading-6 text-slate-300">{block.action}</p><div className="mt-3 text-2xl font-black">{block.score}</div></div>)}</div>
    </section>
  </main>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<{ label: string; value: string }> }) { return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span><select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm" value={value} onChange={(e)=>onChange(e.target.value)}>{options.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function Slider({ label, value, valueNum, min, max, setValue }: { label: string; value: string; valueNum: number; min: number; max: number; setValue: (v: number) => void }) { return <label className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="mb-2 flex justify-between text-sm font-black"><span>{label}</span><span>{value}</span></div><input className="w-full" type="range" min={min} max={max} value={valueNum} onChange={(e)=>setValue(Number(e.target.value))}/></label>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="text-2xl font-black">{value}</div></div>; }
