import { getAllCityIntelligence } from "@/lib/city-intelligence";

const routeGroups = [
  {
    title: "Primary product surfaces",
    routes: [
      { href: "/", title: "World Globe", body: "Main visual exploration page." },
      { href: "/rankings", title: "Rankings", body: "Filterable city intelligence control center." },
      { href: "/trips", title: "Trips", body: "Anonymous saved-trip memory." },
      { href: "/lab", title: "Lab", body: "Functional city comparison and route logic tools." }
    ]
  },
  {
    title: "Stored data APIs",
    routes: [
      { href: "/api/city-intelligence", title: "City intelligence", body: "Unified stored city records." },
      { href: "/api/cities", title: "Cities", body: "Filterable city list with stored metadata." },
      { href: "/api/tourism", title: "Tourism", body: "Stored downloadable tourism snapshot." },
      { href: "/api/memory", title: "Memory", body: "Anonymous visitor memory summary." }
    ]
  }
];

function auditCity(city: ReturnType<typeof getAllCityIntelligence>[number]) {
  const checks = [
    city.visuals?.slides?.length >= 5,
    Boolean(city.pulse?.headlines?.length),
    Boolean(city.identityVenueCounts?.locals),
    Boolean(city.demographics?.touristNationalityMix?.length),
    Boolean(city.monthlyWeather?.July),
    Boolean(city.tourism?.cityTourismDemandScore),
    Boolean(city.venues?.bars)
  ];
  return checks.filter(Boolean).length;
}

export default function PortalPage() {
  const cities = getAllCityIntelligence();
  const top100 = cities.slice(0, 100);
  const complete = top100.filter((city) => auditCity(city) === 7).length;
  const topCountries = [...new Set(top100.map((city) => city.country))].slice(0, 12);
  const topCities = cities.slice(0, 8);

  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 text-white">
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Command hub</p>
      <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">Social Travel Intelligence OS portal.</h1>
      <p className="mt-4 max-w-3xl text-slate-300">One control page for the live product surfaces, stored intelligence APIs, top-city audit, and fast jumps into city detail pages. No dead buttons.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="Stored cities" value={cities.length} />
        <Metric label="Top-100 audit" value={`${complete}/100`} />
        <Metric label="Countries" value={new Set(cities.map((city)=>city.country)).size} />
        <Metric label="Runtime source" value="Stored" />
      </div>
    </section>

    <section className="mt-6 grid gap-4 lg:grid-cols-2">
      {routeGroups.map((group) => <article key={group.title} className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <h2 className="text-2xl font-black">{group.title}</h2>
        <div className="mt-4 grid gap-3">{group.routes.map((route)=><a key={route.href} href={route.href} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-sky-200/50 hover:bg-sky-200/10"><div className="flex items-center justify-between gap-3"><h3 className="font-black text-white">{route.title}</h3><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-sky-200">Open</span></div><p className="mt-1 text-sm text-slate-400">{route.body}</p><p className="mt-2 break-all text-xs text-slate-500">{route.href}</p></a>)}</div>
      </article>)}
    </section>

    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-black">Fast city access</h2><a href="/rankings" className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950">Open full rankings</a></div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">{topCities.map((city)=><a key={city.id} href={`/cities/${city.id}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-sky-200/50"><div className="text-4xl">{city.visuals.flag}</div><h3 className="mt-3 text-xl font-black">{city.name}</h3><p className="text-sm text-slate-400">{city.country} · pulse {city.pulse.demandPressure}</p></a>)}</div>
    </section>

    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <h2 className="text-2xl font-black">Top country coverage</h2>
      <div className="mt-4 flex flex-wrap gap-2">{topCountries.map((country)=><a key={country} href={`/api/cities?country=${encodeURIComponent(country)}`} className="rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm font-black text-slate-300 hover:border-sky-200/50">{country}</a>)}</div>
    </section>
  </main>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="mt-1 text-3xl font-black">{value}</div></div>; }
