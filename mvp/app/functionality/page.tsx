import { featureSummary, siteFeatures } from "@/lib/site-features";

const statusStyle = {
  working: "bg-emerald-200 text-slate-950",
  stored: "bg-sky-200 text-slate-950",
  debug: "bg-amber-200 text-slate-950",
  scaffold: "bg-white/10 text-slate-300"
};

export default function FunctionalityPage() {
  const summary = featureSummary();
  const groups = ["core", "tools", "intelligence", "audit", "debug"] as const;
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 text-white">
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Functionality index</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">Every button should lead somewhere useful.</h1>
          <p className="mt-4 max-w-3xl text-slate-300">This page is the site-wide test map for the product. It lists core pages, tools, stored APIs, audit surfaces, and debug endpoints with acceptance checks.</p>
        </div>
        <a href="/portal" className="rounded-full bg-sky-200 px-4 py-2 text-sm font-black text-slate-950">Open Portal</a>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="Total features" value={summary.total} />
        <Metric label="Working pages/tools" value={summary.working} />
        <Metric label="Stored data APIs" value={summary.stored} />
        <Metric label="Debug endpoints" value={summary.debug} />
      </div>
    </section>

    {groups.map((group) => {
      const features = siteFeatures.filter((feature) => feature.group === group);
      if (!features.length) return null;
      return <section key={group} className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <h2 className="text-2xl font-black capitalize">{group}</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {features.map((feature) => <a key={feature.href} href={feature.href} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-sky-200/50 hover:bg-sky-200/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="text-xl font-black">{feature.title}</h3><p className="mt-1 break-all text-xs text-slate-500">{feature.href}</p></div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle[feature.status]}`}>{feature.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
            <div className="mt-3 grid gap-1">
              {feature.acceptance.map((item) => <div key={item} className="text-xs text-slate-400">✓ {item}</div>)}
            </div>
          </a>)}
        </div>
      </section>;
    })}
  </main>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div>;
}
