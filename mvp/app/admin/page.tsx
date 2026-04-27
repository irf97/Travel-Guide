import { getProviderHealth } from "@/lib/server/provider-status";
import { getDbStatus } from "@/lib/server/db";
import { getSupabaseStatus } from "@/lib/server/supabase";
import { getAiAdapterStatus } from "@/lib/server/openai-adapter";

export const dynamic = "force-dynamic";

const routeGroups = [
  {
    title: "Main product pages",
    description: "Human-facing screens for testing the product flow on phone or desktop.",
    routes: [
      { label: "Main OS", href: "/", note: "Landing/dashboard shell" },
      { label: "Rankings", href: "/rankings", note: "Main non-map ranking page with country/gender/nationality filters" },
      { label: "World Globe", href: "/world", note: "3D globe + connected filters + memory + live city intelligence" },
      { label: "Saved Trips", href: "/trips", note: "Anonymous browser memory trip list" },
      { label: "Lab", href: "/lab", note: "Experiment area" },
      { label: "Portal", href: "/portal", note: "Portal/navigation surface" }
    ]
  },
  {
    title: "Core health and memory APIs",
    description: "Use these to verify DB, anonymous memory, and city seed metadata.",
    routes: [
      { label: "Health", href: "/api/health", note: "Database/storage/AI/provider status JSON" },
      { label: "Memory", href: "/api/memory", note: "Anonymous visitor memory summary" },
      { label: "Cities", href: "/api/cities", note: "All cities with modeled demographics" },
      { label: "Spain cities", href: "/api/cities?country=Spain", note: "Country filter test" },
      { label: "Europe cities", href: "/api/cities?continent=Europe", note: "Continent filter test" }
    ]
  },
  {
    title: "Live/open intelligence APIs",
    description: "No flight/hotel pricing here. These are the open/live intelligence layers.",
    routes: [
      { label: "Weather: Barcelona", href: "/api/live/weather?lat=41.3851&lng=2.1734", note: "Open-Meteo weather test" },
      { label: "GDELT pulse: Barcelona", href: "/api/live/city-pulse?city=Barcelona", note: "News/risk/momentum pulse" },
      { label: "City intelligence: Barcelona", href: "/api/live/city-intelligence?city=Barcelona&lat=41.3851&lng=2.1734&nightlifeScore=90&foodScore=88&socialScore=86", note: "Weather + GDELT + modeled venue/tourism proxy" },
      { label: "City intelligence: Istanbul", href: "/api/live/city-intelligence?city=Istanbul&lat=41.0082&lng=28.9784&nightlifeScore=88&foodScore=94&socialScore=92", note: "Second city smoke test" }
    ]
  },
  {
    title: "Recommendation and scoring APIs",
    description: "Backend scoring/intake surfaces that should remain build-safe and fallback-safe.",
    routes: [
      { label: "Cost model", href: "/api/cost-model", note: "Cost model endpoint" },
      { label: "World recommend", href: "/api/world/recommend", note: "World recommendation endpoint" },
      { label: "Cities recommend", href: "/api/cities/recommend", note: "City recommendation endpoint" },
      { label: "Places recommend", href: "/api/places/recommend", note: "Place recommendation endpoint" },
      { label: "Feedback", href: "/api/feedback", note: "Feedback endpoint" }
    ]
  }
];

function StatusBadge({ status }: { status: string }) {
  const color = status === "live" || status === "available" ? "bg-emerald-300 text-slate-950" : status === "fallback" ? "bg-amber-300 text-slate-950" : "bg-white/10 text-slate-300";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${color}`}>{status}</span>;
}

export default function AdminPage() {
  const providers = getProviderHealth();
  const db = getDbStatus();
  const supabase = getSupabaseStatus();
  const ai = getAiAdapterStatus();
  const configured = providers.filter((provider) => provider.configured).length;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 text-white">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Admin status</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] md:text-6xl">Backend control room</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">Personal-use readiness dashboard for database, storage, AI, open-data providers, live APIs, route testing, and commercial gap-fillers. This page is intentionally read-only until auth/admin roles are wired.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="Providers" value={`${configured}/${providers.length}`} note="configured or no-key available" />
          <Metric label="Database" value={db.configured ? "Live" : "Fallback"} note={db.reason ?? "DATABASE_URL active"} />
          <Metric label="Storage" value={supabase.storageConfigured ? "Live" : "Fallback"} note={supabase.reason ?? "Supabase storage active"} />
          <Metric label="AI" value={ai.configured ? "Ready" : "Fallback"} note={ai.reason ?? "OpenAI key active, gated usage"} />
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-sky-200/15 bg-sky-200/[0.045] p-5 backdrop-blur-xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">Route console</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Pages and pipeline links</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Open these directly to test all connected product pages, fallback-safe APIs, memory, demographics, weather, and GDELT city pulse from your phone.</p>
          </div>
          <a className="rounded-full bg-sky-200 px-4 py-2 text-xs font-black text-slate-950" href="/api/health">Open JSON health</a>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {routeGroups.map((group) => (
            <article key={group.title} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-black">{group.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">{group.description}</p>
              <div className="mt-4 grid gap-2">
                {group.routes.map((route) => (
                  <a key={route.href} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-sky-200/50 hover:bg-sky-200/10" href={route.href}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-white">{route.label}</span>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-200 group-hover:bg-sky-200 group-hover:text-slate-950">Open</span>
                    </div>
                    <div className="mt-1 break-all text-xs leading-5 text-slate-500">{route.href}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{route.note}</div>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2">
          <h2 className="text-2xl font-black tracking-tight">Provider matrix</h2>
          <a className="rounded-full bg-sky-200 px-4 py-2 text-xs font-black text-slate-950" href="/api/health">Open JSON health</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-400">
                <th className="p-3">Provider</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Personal-use</th>
                <th className="p-3">Env vars</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.key} className="border-b border-white/10 align-top">
                  <td className="p-3 font-black text-white">{provider.label}</td>
                  <td className="p-3 text-slate-300">{provider.category}</td>
                  <td className="p-3"><StatusBadge status={provider.status} /></td>
                  <td className="p-3 text-slate-300">{provider.requiredForPersonalUse ? "Core" : "Later"}</td>
                  <td className="p-3 text-xs text-slate-400">{provider.envVars.join(", ") || "none"}</td>
                  <td className="p-3 max-w-md text-slate-300">{provider.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</div><div className="mt-2 text-2xl font-black text-white">{value}</div><div className="mt-1 text-xs leading-5 text-slate-400">{note}</div></div>;
}
