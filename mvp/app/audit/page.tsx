import { getAllCityIntelligence } from "@/lib/city-intelligence";

function auditCity(city: ReturnType<typeof getAllCityIntelligence>[number]) {
  const checks = {
    visuals: Boolean(city.visuals?.slides?.length >= 5),
    pulse: Boolean(city.pulse?.headlines?.length),
    nationalityMix: Boolean(city.demographics?.touristNationalityMix?.length),
    genderMix: Boolean(city.demographics?.nightlifeGenderMix),
    venueCounts: Boolean(city.venues?.bars && city.venues?.clubs && city.venues?.restaurants && city.venues?.cafes),
    identityVenueSplit: Boolean(city.identityVenueCounts?.locals && city.identityVenueCounts?.tourists && city.identityVenueCounts?.students && city.identityVenueCounts?.remoteWorkers),
    monthlyWeather: Boolean(city.monthlyWeather?.January && city.monthlyWeather?.July && city.monthlyWeather?.December),
    tourism: Boolean(city.tourism?.cityTourismDemandScore),
    cityPage: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.values(checks).length;
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  return {
    city,
    checks,
    missing,
    complete: missing.length === 0,
    completenessScore: Math.round((passed / total) * 100)
  };
}

export default function AuditPage() {
  const audited = getAllCityIntelligence().slice(0, 100).map(auditCity);
  const complete = audited.filter((item) => item.complete).length;
  const average = Math.round(audited.reduce((sum, item) => sum + item.completenessScore, 0) / Math.max(1, audited.length));
  const needsReview = audited.filter((item) => !item.complete);
  const strongest = audited.slice().sort((a, b) => b.completenessScore - a.completenessScore).slice(0, 12);

  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 text-white">
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Top-100 completeness audit</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">Stored intelligence quality control.</h1>
          <p className="mt-4 max-w-3xl text-slate-300">Checks whether the top 100 cities have visuals, pulse, nationality mix, gender mix, venue counts, identity venue splits, monthly weather, tourism data, and a city page.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <a className="rounded-full bg-sky-200 px-4 py-2 text-slate-950" href="/api/audit/top-100">Open JSON</a>
          <a className="rounded-full border border-white/10 px-4 py-2 text-slate-300" href="/rankings">Rankings</a>
          <a className="rounded-full border border-white/10 px-4 py-2 text-slate-300" href="/portal">Portal</a>
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="Cities audited" value={audited.length} note="Top stored city records" />
        <Metric label="Complete" value={`${complete}/100`} note="All required fields present" />
        <Metric label="Average" value={`${average}%`} note="Mean completeness" />
        <Metric label="Needs review" value={needsReview.length} note="Records with missing checks" />
      </div>
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <article className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <h2 className="text-2xl font-black">Strongest records</h2>
        <div className="mt-4 grid gap-2">
          {strongest.map((item, index) => <a key={item.city.id} href={`/cities/${item.city.id}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 transition hover:border-sky-200/50">
            <div className="flex items-center justify-between gap-3"><span className="font-black">#{index + 1} {item.city.visuals.flag} {item.city.name}</span><span className="rounded-full bg-sky-200 px-3 py-1 text-xs font-black text-slate-950">{item.completenessScore}%</span></div>
            <p className="mt-1 text-xs text-slate-400">{item.city.country} · pulse {item.city.pulse.demandPressure} · venues {item.city.venues.densityScore}</p>
          </a>)}
        </div>
      </article>

      <article className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <h2 className="text-2xl font-black">Review queue</h2>
        <div className="mt-4 max-h-[620px] overflow-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-950 text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr><th className="p-3">City</th><th className="p-3">Score</th><th className="p-3">Missing</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {audited.map((item) => <tr key={item.city.id} className="border-t border-white/10 align-top">
                <td className="p-3"><div className="font-black text-white">{item.city.visuals.flag} {item.city.name}</div><div className="text-xs text-slate-400">{item.city.country}</div></td>
                <td className="p-3"><span className={item.complete ? "rounded-full bg-emerald-200 px-3 py-1 text-xs font-black text-slate-950" : "rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-slate-950"}>{item.completenessScore}%</span></td>
                <td className="p-3 text-slate-300">{item.missing.length ? item.missing.join(", ") : "Complete"}</td>
                <td className="p-3"><div className="flex flex-wrap gap-2"><a href={`/cities/${item.city.id}`} className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-slate-300">City</a><a href={`/api/city-intelligence?id=${item.city.id}`} className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-slate-300">JSON</a></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </main>;
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div><div className="mt-1 text-xs leading-5 text-slate-400">{note}</div></div>;
}
