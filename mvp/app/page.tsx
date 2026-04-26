"use client";

import { useMemo, useState } from "react";
import { Card, SoftCard, Button, GhostButton, Chip, ScoreBar } from "@/components/ui";
import { cities, events, months, places } from "@/lib/seed";
import { defaultIntent, extractIntentLocally } from "@/lib/extraction";
import { scoreCity, scorePlace } from "@/lib/scoring";
import type { FeatureKey, Intent, Place, TravelStyle } from "@/lib/types";
import { formatEuro } from "@/lib/utils";

const pages = [
  "Overview",
  "Traveler Intake",
  "Destinations",
  "Places",
  "Business Portal",
  "Image Definer",
  "Networking",
  "Itinerary",
  "Cost Model",
  "Safety",
  "Architecture"
] as const;

type Page = (typeof pages)[number];

const featureLabels: Record<FeatureKey, string> = {
  sea: "Sea",
  historic: "Historic",
  seafood: "Seafood",
  local_food: "Local food",
  young_adults: "Young adults",
  international_crowd: "International crowd",
  clubs: "Clubs",
  bars: "Bars",
  matcha: "Matcha",
  baked_goods: "Baked goods",
  sports_tv: "Sports TV",
  coworking: "Coworking",
  laptop_friendly: "Laptop-friendly",
  terrace: "Terrace",
  live_music: "Live music",
  beach_sports: "Beach sports",
  language_exchange: "Language exchange",
  startup_events: "Startup events"
};

const featureKeys = Object.keys(featureLabels) as FeatureKey[];

function activeFeatureKeys(intent: Intent) {
  return featureKeys.filter((feature) => intent.desired_features[feature]);
}

export default function App() {
  const [page, setPage] = useState<Page>("Overview");
  const [note, setNote] = useState("Historic old city by the sea, fresh seafood, not too crowded, young international people, bars, casual networking, sports TV sometimes, cafés with baked goods and matcha.");
  const [groupSize, setGroupSize] = useState(5);
  const [ageRange, setAgeRange] = useState("25-30");
  const [budget, setBudget] = useState(1000);
  const [nights, setNights] = useState(7);
  const [month, setMonth] = useState("July");
  const [style, setStyle] = useState<TravelStyle>("balanced");
  const [intent, setIntent] = useState<Intent>(defaultIntent());
  const [tempPlace, setTempPlace] = useState<Place | null>(null);

  function runExtraction() {
    setIntent(extractIntentLocally({ text: note, groupSize, ageRange, budget, nights, month, style }));
  }

  const rankedCities = useMemo(() => {
    return cities
      .map((city) => ({ city, result: scoreCity(city, intent) }))
      .sort((a, b) => b.result.score - a.result.score);
  }, [intent]);

  const rankedPlaces = useMemo(() => {
    const allPlaces = tempPlace ? [...places, tempPlace] : places;
    const cityScores = new Map(rankedCities.map(({ city, result }) => [city.id, result.score]));
    return allPlaces
      .map((place) => ({ place, result: scorePlace(place, intent, cityScores.get(place.city_id) ?? 70) }))
      .sort((a, b) => b.result.score - a.result.score);
  }, [intent, rankedCities, tempPlace]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-16">
      <header className="sticky top-0 z-50 -mx-4 border-b border-white/10 bg-slate-950/75 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button onClick={() => setPage("Overview")} className="text-left text-lg font-black tracking-tight text-white">
            Social Travel Intelligence OS
          </button>
          <nav className="flex max-w-[72vw] gap-2 overflow-x-auto">
            {pages.map((item) => (
              <button
                key={item}
                onClick={() => setPage(item)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition ${page === item ? "bg-sky-300 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/50"}`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {page === "Overview" && <Overview setPage={setPage} />}
      {page === "Traveler Intake" && (
        <TravelerIntake
          note={note}
          setNote={setNote}
          groupSize={groupSize}
          setGroupSize={setGroupSize}
          ageRange={ageRange}
          setAgeRange={setAgeRange}
          budget={budget}
          setBudget={setBudget}
          nights={nights}
          setNights={setNights}
          month={month}
          setMonth={setMonth}
          style={style}
          setStyle={setStyle}
          intent={intent}
          setIntent={setIntent}
          runExtraction={runExtraction}
        />
      )}
      {page === "Destinations" && <Destinations rankedCities={rankedCities} intent={intent} setIntent={setIntent} />}
      {page === "Places" && <Places rankedPlaces={rankedPlaces} setTempPlace={setTempPlace} />}
      {page === "Business Portal" && <BusinessPortal />}
      {page === "Image Definer" && <ImageDefiner />}
      {page === "Networking" && <Networking intent={intent} />}
      {page === "Itinerary" && <Itinerary rankedPlaces={rankedPlaces} rankedCities={rankedCities} />}
      {page === "Cost Model" && <CostModel />}
      {page === "Safety" && <Safety />}
      {page === "Architecture" && <Architecture />}
    </main>
  );
}

function Overview({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <section className="grid gap-6 py-14 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <Chip>Investor-facing production MVP scaffold</Chip>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.075em] text-white md:text-7xl">
          Travel planning with social context, not shallow descriptions.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Users describe the experience they want. The system converts messy human preference into structured intent, then ranks cities, neighborhoods, restaurants, cafés, bars, coworking spaces, sports spots, opt-in social events, and social routes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setPage("Traveler Intake")}>Try traveler intake</Button>
          <GhostButton onClick={() => setPage("Destinations")}>Explore destination intelligence</GhostButton>
          <GhostButton onClick={() => setPage("Places")}>Explore place intelligence</GhostButton>
          <GhostButton onClick={() => setPage("Business Portal")}>View business portal</GhostButton>
        </div>
      </div>
      <Card>
        <h2 className="text-3xl font-black tracking-tight text-white">Product thesis</h2>
        <p className="mt-3 text-slate-300">
          Online descriptions are vague. Star ratings are shallow. Travel tools do not model social fit, ambience, group outcome probability, or when a place actually works.
        </p>
        <div className="mt-6 grid gap-3 text-sm text-slate-300">
          {[
            "Preference input",
            "Structured intent",
            "City matching",
            "Place matching",
            "Business confirmation",
            "Social opportunities",
            "Feedback calibration"
          ].map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-300 font-black text-slate-950">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function TravelerIntake(props: any) {
  const { intent, setIntent } = props;
  const active = activeFeatureKeys(intent);
  return (
    <section className="py-10">
      <h1 className="text-4xl font-black tracking-tight text-white">Traveler Preference Intake</h1>
      <p className="mt-2 text-slate-300">Text or voice-style input becomes validated structured intent. The local extractor simulates Phase 1; the API endpoint is ready for OpenAI in Phase 3.</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <label className="text-sm font-bold text-slate-200">Natural language preference</label>
          <textarea className="mt-2 min-h-36 w-full rounded-2xl border border-white/10 bg-white/10 p-4 text-white outline-none" value={props.note} onChange={(event) => props.setNote(event.target.value)} />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input className="rounded-xl border border-white/10 bg-white/10 p-3" type="number" value={props.groupSize} onChange={(e) => props.setGroupSize(Number(e.target.value))} />
            <input className="rounded-xl border border-white/10 bg-white/10 p-3" value={props.ageRange} onChange={(e) => props.setAgeRange(e.target.value)} />
            <input className="rounded-xl border border-white/10 bg-white/10 p-3" type="number" value={props.budget} onChange={(e) => props.setBudget(Number(e.target.value))} />
            <input className="rounded-xl border border-white/10 bg-white/10 p-3" type="number" value={props.nights} onChange={(e) => props.setNights(Number(e.target.value))} />
            <select className="rounded-xl border border-white/10 bg-white/10 p-3" value={props.month} onChange={(e) => props.setMonth(e.target.value)}>
              {months.map((m) => <option key={m}>{m}</option>)}
            </select>
            <select className="rounded-xl border border-white/10 bg-white/10 p-3" value={props.style} onChange={(e) => props.setStyle(e.target.value)}>
              {["balanced", "social", "nightlife", "culture", "food", "budget", "remote-work", "sports"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Button className="mt-4" onClick={props.runExtraction}>Extract structured intent</Button>
          <h3 className="mt-6 text-lg font-black text-white">Feature toggles</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {featureKeys.map((feature) => (
              <label key={feature} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                <input
                  className="mr-2"
                  type="checkbox"
                  checked={intent.desired_features[feature]}
                  onChange={(event) => setIntent({ ...intent, desired_features: { ...intent.desired_features, [feature]: event.target.checked } })}
                />
                {featureLabels[feature]}
              </label>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-black text-white">Structured intent</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {active.map((feature) => <Chip key={feature}>{featureLabels[feature]}</Chip>)}
            <Chip tone="good">confidence {(intent.confidence.overall * 100).toFixed(0)}%</Chip>
          </div>
          <pre className="mt-4 max-h-[560px] overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-sky-100">{JSON.stringify(intent, null, 2)}</pre>
        </Card>
      </div>
    </section>
  );
}

function Destinations({ rankedCities }: any) {
  return (
    <section className="py-10">
      <h1 className="text-4xl font-black tracking-tight text-white">Destination Intelligence</h1>
      <p className="mt-2 text-slate-300">Ranked by budget fit, seasonality, social density, nightlife, culture/history, food, mobility, feature fit, and risk penalties.</p>
      <Card className="mt-6">
        <div className="grid gap-4">
          {rankedCities.map(({ city, result }: any, index: number) => (
            <ScoreBar key={city.id} label={`${index + 1}. ${city.name}`} score={result.score} meta={`${formatEuro(result.estimatedCost)} pp · ${city.best_neighborhoods.join(", ")}`} />
          ))}
        </div>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rankedCities.map(({ city, result }: any) => (
          <SoftCard key={city.id}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-black text-white">{city.name}</h3>
              <Chip tone="good">{result.score}/100</Chip>
            </div>
            <p className="mt-2 text-sm text-slate-300">{city.notes}</p>
            <p className="mt-3 text-sm text-slate-400"><strong className="text-white">Cost:</strong> {formatEuro(result.estimatedCost)} pp</p>
            <p className="text-sm text-slate-400"><strong className="text-white">Neighborhoods:</strong> {city.best_neighborhoods.join(", ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">{city.risk_flags.map((risk: string) => <Chip key={risk} tone="warn">{risk}</Chip>)}</div>
            <pre className="mt-3 rounded-xl bg-black/25 p-3 text-xs text-sky-100">{JSON.stringify(result.explanation, null, 2)}</pre>
          </SoftCard>
        ))}
      </div>
    </section>
  );
}

function Places({ rankedPlaces, setTempPlace }: any) {
  const [form, setForm] = useState({ name: "", city_id: "valencia", neighborhood: "", type: "cafe", price_level: 2, social_score: 80, evidence_score: 75, business_confirmed: false, notes: "" });
  return (
    <section className="py-10">
      <h1 className="text-4xl font-black tracking-tight text-white">Place Intelligence</h1>
      <p className="mt-2 text-slate-300">Restaurants, cafés, bars, coworking, sports spots, third spaces, cultural places, and social events.</p>
      <Card className="mt-6">
        <div className="grid gap-4">
          {rankedPlaces.slice(0, 8).map(({ place, result }: any, index: number) => <ScoreBar key={place.id} label={`${index + 1}. ${place.name}`} score={result.score} meta={`${place.type} · ${place.neighborhood}`} />)}
        </div>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rankedPlaces.map(({ place, result }: any) => (
          <SoftCard key={place.id}>
            <h3 className="text-xl font-black text-white">{place.name}</h3>
            <p className="text-sm text-slate-400">{place.type} · {place.neighborhood}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip tone="good">{result.score}/100</Chip>
              <Chip>{place.business_confirmed ? "business confirmed" : "not confirmed"}</Chip>
              <Chip>{"€".repeat(place.price_level)}</Chip>
            </div>
            <p className="mt-3 text-sm text-slate-300">{place.notes}</p>
            <div className="mt-3 flex flex-wrap gap-2">{[...place.feature_tags, ...place.ambience_tags].map((tag) => <Chip key={tag}>{tag}</Chip>)}</div>
          </SoftCard>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="text-2xl font-black text-white">Temporary place simulator</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border border-white/10 bg-white/10 p-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="rounded-xl border border-white/10 bg-white/10 p-3" value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input className="rounded-xl border border-white/10 bg-white/10 p-3" placeholder="Neighborhood" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
          <input className="rounded-xl border border-white/10 bg-white/10 p-3" placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        </div>
        <Button className="mt-4" onClick={() => setTempPlace({ id: `temp-${Date.now()}`, name: form.name || "Temporary Place", type: form.type, city_id: form.city_id, neighborhood: form.neighborhood || "Custom", ambience_tags: ["user-estimated"], feature_tags: ["young_adults", "international_crowd"], price_level: form.price_level as any, social_ambience_score: form.social_score, evidence_confidence_score: form.evidence_score, business_confirmed: form.business_confirmed, good_for: ["groups", "meeting people"], notes: form.notes || "Temporary custom place." })}>Add temporary place</Button>
      </Card>
    </section>
  );
}

function BusinessPortal() { return <SimplePage title="Business Portal / Ambience Confirmation UI" body="Business owners confirm social reality: identity, ambience, features, best times, proof media, and generated structured profile. Uploads are gated behind authentication in Phase 2." />; }
function ImageDefiner() { return <SimplePage title="Image-Based Place Definer" body="Prepare safe image analysis: venue-level features only. No identifying private individuals, no attractiveness scoring, no sensitive trait inference. Prototype output is simulated until backend analysis is added." />; }
function Networking({ intent }: { intent: Intent }) { return <SimpleList title="Best opt-in environments to meet international people" items={events.map((e) => `${e.name} — ${e.category}`)} />; }
function Itinerary({ rankedPlaces, rankedCities }: any) { return <SimpleList title="Itinerary / Social Route Generator" items={[`Day 1: arrival + low-pressure dinner in ${rankedCities[0]?.city.name}`, `Afternoon: cultural/historic walk`, `Evening: ${rankedPlaces[0]?.place.name}`, `Night: opt-in bar/event, not individual people`, `Recovery window: calm café or terrace third space`]} />; }
function CostModel() { return <SimplePage title="Cost Model" body="Inputs: MAU, voice notes, image analyses, LLM recommendations, places, businesses, storage, API multiplier. Rule: analyze once → store structured tags → reuse forever." />; }
function Safety() { return <SimpleList title="Trust, Safety, and Compliance" items={["Prototype only; production needs privacy policy", "No sensitive trait inference", "No private individual identification", "No attractiveness ranking", "Business images require ownership or consent", "Faces blurred in production", "Networking recommendations are opt-in events only", "GitHub Pages is demo hosting, not production SaaS"]} />; }
function Architecture() { return <SimplePage title="Architecture / Product Roadmap" body="Pipeline: voice note → transcription → structured preference extraction → city scoring → place matching → image/business ambience layer → route generation → feedback → calibration. API route stubs and Prisma schema are included." />; }

function SimplePage({ title, body }: { title: string; body: string }) { return <section className="py-10"><Card><h1 className="text-4xl font-black text-white">{title}</h1><p className="mt-4 max-w-3xl text-slate-300">{body}</p></Card></section>; }
function SimpleList({ title, items }: { title: string; items: string[] }) { return <section className="py-10"><Card><h1 className="text-4xl font-black text-white">{title}</h1><div className="mt-5 grid gap-3 md:grid-cols-2">{items.map((item) => <SoftCard key={item}>{item}</SoftCard>)}</div></Card></section>; }
