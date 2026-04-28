import { getAllCityIntelligence } from "@/lib/city-intelligence";

function avg(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
}

function aggregateNationality(cities: ReturnType<typeof getAllCityIntelligence>) {
  const map = new Map<string, number>();
  for (const city of cities) {
    for (const item of city.demographics.touristNationalityMix) {
      map.set(item.label, (map.get(item.label) ?? 0) + item.share);
    }
  }
  return [...map.entries()].map(([label, share]) => ({ label, share: Math.round(share / Math.max(1, cities.length)) })).sort((a, b) => b.share - a.share).slice(0, 12);
}

export default function DemographicsPage() {
  const cities = getAllCityIntelligence().slice(0, 100);
  const strongestFemaleNightlife = cities.slice().sort((a, b) => b.demographics.nightlifeGenderMix.female - a.demographics.nightlifeGenderMix.female).slice(0, 12);
  const mostBalanced = cities.slice().sort((a, b) => b.demographics.genderBalanceScore - a.demographics.genderBalanceScore).slice(0, 12);
  const nationalities = aggregateNationality(cities);
  const aggregate = {
    generalMale: avg(cities.map((city) => city.demographics.generalGenderMix.male)),
    generalFemale: avg(cities.map((city) => city.demographics.generalGenderMix.female)),
    nightlifeMale: avg(cities.map((city) => city.demographics.nightlifeGenderMix.male)),
    nightlifeFemale: avg(cities.map((city) => city.demographics.nightlifeGenderMix.female)),
    genderBalance: avg(cities.map((city) => city.demographics.genderBalanceScore)),
    touristShare: avg(cities.map((city) => city.demographics.touristVisitorShare))
  };

  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 text-white">
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Stored demographic intelligence</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">Gender and nationality dashboard.</h1>
          <p className="mt-4 max-w-3xl text-slate-300">A direct view of the stored gender, nightlife gender, tourist nationality mix, local/tourist share, and confidence fields used by Rankings and the World Globe.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-black"><a href="/rankings" className="rounded-full bg-sky-200 px-4 py-2 text-slate-950">Rankings</a><a href="/api/demographics" className="rounded-full border border-white/10 px-4 py-2 text-slate-300">Open JSON</a><a href="/functionality" className="rounded-full border border-white/10 px-4 py-2 text-slate-300">Functionality</a></div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="General male" value={`${aggregate.generalMale}%`} />
        <Metric label="General female" value={`${aggregate.generalFemale}%`} />
        <Metric label="Nightlife female" value={`${aggregate.nightlifeFemale}%`} />
        <Metric label="Avg balance" value={aggregate.genderBalance} />
      </div>
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <Panel title="Aggregated nationality mix">
        <div className="grid gap-2">{nationalities.map((item) => <Bar key={item.label} label={item.label} value={item.share} suffix="%" />)}</div>
      </Panel>
      <Panel title="Most balanced nightlife">
        <CityList cities={mostBalanced} metric={(city) => `${city.demographics.genderBalanceScore}/100`} sub={(city) => `${city.demographics.nightlifeGenderMix.male}% M · ${city.demographics.nightlifeGenderMix.female}% F`} />
      </Panel>
      <Panel title="Highest female nightlife share">
        <CityList cities={strongestFemaleNightlife} metric={(city) => `${city.demographics.nightlifeGenderMix.female}%`} sub={(city) => `balance ${city.demographics.genderBalanceScore} · tourist ${city.demographics.touristVisitorShare}%`} />
      </Panel>
    </section>

    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <h2 className="text-2xl font-black">Top-100 city demographics table</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-slate-950 text-xs uppercase tracking-[0.16em] text-slate-400"><tr><th className="p-3">City</th><th className="p-3">General</th><th className="p-3">Nightlife</th><th className="p-3">Nationality mix</th><th className="p-3">Local/Tourist</th><th className="p-3">Actions</th></tr></thead>
          <tbody>{cities.map((city) => <tr key={city.id} className="border-t border-white/10 align-top"><td className="p-3"><div className="font-black">{city.visuals.flag} {city.name}</div><div className="text-xs text-slate-400">{city.country}</div></td><td className="p-3 text-slate-300">{city.demographics.generalGenderMix.male}% M · {city.demographics.generalGenderMix.female}% F</td><td className="p-3 text-slate-300">{city.demographics.nightlifeGenderMix.male}% M · {city.demographics.nightlifeGenderMix.female}% F · {city.demographics.nightlifeGenderMix.unknown}% unknown</td><td className="p-3 text-slate-300">{city.demographics.touristNationalityMix.slice(0, 3).map((item) => `${item.label} ${item.share}%`).join(" · ")}</td><td className="p-3 text-slate-300">Local {city.demographics.localResidentShare}% · Tourist {city.demographics.touristVisitorShare}%</td><td className="p-3"><div className="flex flex-wrap gap-2"><a href={`/cities/${city.id}`} className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-slate-300">City</a><a href={`/api/demographics?country=${encodeURIComponent(city.country)}&top=20`} className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-slate-300">Country JSON</a></div></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  </main>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"><h2 className="mb-4 text-2xl font-black">{title}</h2>{children}</section>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div>; }
function Bar({ label, value, suffix }: { label: string; value: number; suffix: string }) { return <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="flex justify-between text-sm"><span>{label}</span><b>{value}{suffix}</b></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-200" style={{ width: `${Math.max(3, Math.min(100, value))}%` }} /></div></div>; }
function CityList({ cities, metric, sub }: { cities: ReturnType<typeof getAllCityIntelligence>; metric: (city: ReturnType<typeof getAllCityIntelligence>[number]) => string; sub: (city: ReturnType<typeof getAllCityIntelligence>[number]) => string }) { return <div className="grid gap-2">{cities.map((city, index) => <a key={city.id} href={`/cities/${city.id}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 transition hover:border-sky-200/50"><div className="flex justify-between gap-3"><span className="font-black">#{index + 1} {city.visuals.flag} {city.name}</span><b>{metric(city)}</b></div><p className="mt-1 text-xs text-slate-400">{sub(city)}</p></a>)}</div>; }
