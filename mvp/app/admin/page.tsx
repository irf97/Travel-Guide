import { getProviderHealth } from "@/lib/server/provider-status";
import { getDbStatus } from "@/lib/server/db";
import { getSupabaseStatus } from "@/lib/server/supabase";
import { getAiAdapterStatus } from "@/lib/server/openai-adapter";

export const dynamic = "force-dynamic";

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
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">Personal-use readiness dashboard for database, storage, AI, open-data providers, live APIs, and commercial gap-fillers. This page is intentionally read-only until auth/admin roles are wired.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="Providers" value={`${configured}/${providers.length}`} note="configured or no-key available" />
          <Metric label="Database" value={db.configured ? "Live" : "Fallback"} note={db.reason ?? "DATABASE_URL active"} />
          <Metric label="Storage" value={supabase.storageConfigured ? "Live" : "Fallback"} note={supabase.reason ?? "Supabase storage active"} />
          <Metric label="AI" value={ai.configured ? "Ready" : "Fallback"} note={ai.reason ?? "OpenAI key active, gated usage"} />
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
