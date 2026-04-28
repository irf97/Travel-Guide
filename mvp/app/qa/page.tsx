import { runSmokeChecks } from "@/lib/qa-smoke";

const badgeClass = {
  pass: "bg-emerald-200 text-slate-950",
  warn: "bg-amber-200 text-slate-950",
  fail: "bg-rose-200 text-slate-950"
};

export default function QaPage() {
  const smoke = runSmokeChecks();
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 text-white">
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Deployment QA</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">Smoke-test dashboard.</h1>
          <p className="mt-4 max-w-3xl text-slate-300">A fast internal QA page for checking whether the stored city data, ranking inputs, demographics layer, audit layer, planner API, and debug endpoints are healthy after deployment.</p>
        </div>
        <div className={`rounded-full px-5 py-3 text-sm font-black ${badgeClass[smoke.summary.status]}`}>{smoke.summary.status.toUpperCase()}</div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="Pass" value={smoke.summary.pass} />
        <Metric label="Warn" value={smoke.summary.warn} />
        <Metric label="Fail" value={smoke.summary.fail} />
        <Metric label="Total checks" value={smoke.summary.total} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-sm font-black">
        <a href="/api/qa/smoke" className="rounded-full bg-sky-200 px-4 py-2 text-slate-950">Open QA JSON</a>
        <a href="/functionality" className="rounded-full border border-white/10 px-4 py-2 text-slate-300">Feature index</a>
        <a href="/api/debug/city-model" className="rounded-full border border-white/10 px-4 py-2 text-slate-300">City model keys</a>
        <a href="/audit" className="rounded-full border border-white/10 px-4 py-2 text-slate-300">Top-100 audit</a>
      </div>
    </section>

    <section className="mt-6 grid gap-3 md:grid-cols-4">
      <Metric label="Cities" value={smoke.metrics.cityCount} />
      <Metric label="Top-100 complete" value={`${smoke.metrics.top100Completeness}%`} />
      <Metric label="Countries" value={smoke.metrics.countryCount} />
      <Metric label="Nationalities" value={smoke.metrics.nationalityLabelCount} />
    </section>

    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <h2 className="text-2xl font-black">Checks</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {smoke.checks.map((check) => <a key={check.id} href={check.href ?? "#"} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-sky-200/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black">{check.label}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass[check.status]}`}>{check.status}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{check.detail}</p>
          {check.href ? <p className="mt-2 break-all text-xs text-slate-500">{check.href}</p> : null}
        </a>)}
      </div>
    </section>
  </main>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div>;
}
