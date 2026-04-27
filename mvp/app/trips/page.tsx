import { withDb } from "@/lib/server/db";

export const dynamic = "force-dynamic";

type TripRow = {
  id: string;
  title: string;
  cityId: string | null;
  month: string | null;
  budgetLevel: string | null;
  goal: string | null;
  computedScore: number | null;
  notes: string | null;
  createdAt: Date | string;
};

export default async function TripsPage() {
  const result = await withDb(
    async (db) => ({ status: "live" as const, trips: await db.trip.findMany({ orderBy: { createdAt: "desc" }, take: 50 }) }),
    () => ({ status: "fallback" as const, trips: [] as TripRow[] })
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12 text-white">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Personal trip memory</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] md:text-6xl">Saved trips</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">Trips saved from the world dashboard. When `DATABASE_URL` is missing, this page stays in fallback mode instead of crashing.</p>
        <div className="mt-5 inline-flex rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300">Mode: {result.status}</div>
      </section>

      <section className="mt-6 grid gap-4">
        {result.trips.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.035] p-8 text-slate-300">
            <h2 className="text-2xl font-black text-white">No persisted trips yet</h2>
            <p className="mt-2 leading-7">Open `/world`, select a city, and use Save Trip. If database env vars are not configured yet, the API will return an honest fallback response without persisting.</p>
            <a className="mt-5 inline-flex rounded-full bg-sky-200 px-5 py-3 text-sm font-black text-slate-950" href="/world">Open World Globe</a>
          </div>
        ) : result.trips.map((trip) => (
          <article key={trip.id} className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">{trip.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{trip.cityId ?? "unknown city"} · {trip.month ?? "any month"} · {trip.goal ?? "general"}</p>
              </div>
              <div className="rounded-full bg-emerald-200 px-4 py-2 text-sm font-black text-slate-950">{trip.computedScore ?? "—"}/100</div>
            </div>
            {trip.notes ? <p className="mt-4 leading-7 text-slate-300">{trip.notes}</p> : null}
          </article>
        ))}
      </section>
    </main>
  );
}
