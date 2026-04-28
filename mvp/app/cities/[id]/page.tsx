import Link from "next/link";
import { notFound } from "next/navigation";
import { CityActionTools } from "@/components/city-action-tools";
import { getAllCityIntelligence, getCityIntelligenceById, type MonthName } from "@/lib/city-intelligence";

export function generateStaticParams() {
  return getAllCityIntelligence().slice(0, 120).map((city) => ({ id: city.id }));
}

export default function CityPage({ params }: { params: { id: string } }) {
  const city = getCityIntelligenceById(params.id);
  if (!city) notFound();
  const month: MonthName = "July";
  const weather = city.monthlyWeather[month];

  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
    <section className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-6xl">{city.visuals.flag}</div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-sky-200">Stored city intelligence</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">{city.name}</h1>
          <p className="mt-3 text-lg text-slate-300">{city.country} · {city.continent} · {city.visuals.symbol}</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-slate-300" href="/rankings">Rankings</Link><Link className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950" href="/world">World</Link><a className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-slate-300" href={`/api/city-intelligence?id=${city.id}`}>JSON</a></div>
      </div>

      <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-3">
        {city.visuals.slides.map((slide) => <div key={slide.kind} className="min-w-[240px] snap-start rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
          <div className="grid h-32 place-items-center rounded-2xl bg-gradient-to-br from-sky-300/20 via-violet-300/10 to-emerald-300/10 text-6xl">{slide.label}</div>
          <h2 className="mt-4 text-lg font-black">{slide.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{slide.caption}</p>
        </div>)}
      </div>
    </section>

    <section className="mx-auto mt-6 max-w-7xl"><CityActionTools city={city} /></section>

    <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="grid gap-4">
        <Panel title="Core scores"><div className="grid gap-3 md:grid-cols-2"><Metric label="Nightlife" value={city.nightlife_score}/><Metric label="Social density" value={city.social_density_score}/><Metric label="History" value={city.history_score}/><Metric label="Food" value={city.food_culture_score}/><Metric label="Mobility" value={city.mobility_score}/><Metric label="Venue density" value={city.venues.densityScore}/></div></Panel>
        <Panel title="Stored city pulse"><div className="grid gap-3 md:grid-cols-4"><Metric label="Articles" value={city.pulse.articleCount}/><Metric label="Momentum" value={city.pulse.eventMomentum}/><Metric label="Risk" value={city.pulse.riskScore}/><Metric label="Demand" value={city.pulse.demandPressure}/></div><div className="mt-4 grid gap-2">{city.pulse.headlines.map((headline) => <div key={headline} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">{headline}</div>)}</div></Panel>
        <Panel title="Venue counts by identity"><div className="grid gap-3 md:grid-cols-4">{Object.entries(city.identityVenueCounts).filter(([key]) => key !== "note").map(([key, value]) => typeof value === "object" ? <div key={key} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><h3 className="text-sm font-black capitalize text-sky-200">{key}</h3><p className="mt-2 text-sm text-slate-300">Bars {value.bars}<br/>Clubs {value.clubs}<br/>Restaurants {value.restaurants}<br/>Cafes {value.cafes}</p></div> : null)}</div><p className="mt-3 text-xs text-slate-500">{city.identityVenueCounts.note}</p></Panel>
      </div>
      <div className="grid gap-4">
        <Panel title="Tourism + passport relevance"><div className="grid grid-cols-2 gap-3"><Metric label="Tourism demand" value={city.tourism.cityTourismDemandScore}/><Metric label="Intl pressure" value={city.tourism.internationalTouristPressure}/><Metric label="Intl guests" value={city.tourism.internationalGuestShare}/><Metric label="Domestic" value={city.tourism.domesticGuestShare}/></div></Panel>
        <Panel title="Gender and nationality"><p className="text-sm leading-6 text-slate-300">Nightlife: {city.demographics.nightlifeGenderMix.male}% male · {city.demographics.nightlifeGenderMix.female}% female · {city.demographics.nightlifeGenderMix.unknown}% unknown</p><div className="mt-4 grid gap-2">{city.demographics.touristNationalityMix.map((item) => <div key={item.label} className="flex justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm"><span>{item.label}</span><b>{item.share}%</b></div>)}</div></Panel>
        <Panel title="July baseline"><div className="grid grid-cols-2 gap-3"><Metric label="Avg temp" value={weather.avgTempC}/><Metric label="Rain days" value={weather.rainDays}/><Metric label="Weather comfort" value={weather.weatherComfort}/><Metric label="Outdoor nightlife" value={weather.outdoorNightlifeScore}/></div></Panel>
      </div>
    </section>
  </main>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"><h2 className="mb-4 text-2xl font-black tracking-tight">{title}</h2>{children}</section>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="mt-1 text-3xl font-black">{value}</div></div>; }
