"use client";

import { useMemo, useState } from "react";
import { Button, Card, Chip, FieldLabel, GhostButton, JsonPanel, ScoreBar, SectionHeader, SoftCard } from "@/components/ui";
import { cities, events, months, places } from "@/lib/seed";
import { extractIntentLocally } from "@/lib/extraction";
import { scoreCity, scorePlace } from "@/lib/scoring";
import type { FeatureKey, Intent, Place, TravelStyle } from "@/lib/types";
import { formatEuro } from "@/lib/utils";

const pages = ["Overview", "Traveler Intake", "Destinations", "Places", "Business Portal", "Image Definer", "Networking", "Itinerary", "Cost Model", "Safety", "Architecture"] as const;
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
const initialNote = "Historic old city by the sea, fresh seafood, not too crowded, young international people, bars, casual networking, sports TV sometimes, cafés with baked goods and matcha.";

function activeFeatureKeys(intent: Intent) {
  return featureKeys.filter((feature) => intent.desired_features[feature]);
}

function activeAvoid(intent: Intent) {
  return Object.entries(intent.avoid).filter(([, value]) => value).map(([key]) => key);
}

export default function App() {
  const [page, setPage] = useState<Page>("Overview");
  const [note, setNote] = useState(initialNote);
  const [groupSize, setGroupSize] = useState(5);
  const [ageRange, setAgeRange] = useState("25-30");
  const [budget, setBudget] = useState(1000);
  const [nights, setNights] = useState(7);
  const [month, setMonth] = useState("July");
  const [style, setStyle] = useState<TravelStyle>("balanced");
  const [intent, setIntent] = useState<Intent>(() => extractIntentLocally({ text: initialNote, groupSize: 5, ageRange: "25-30", budget: 1000, nights: 7, month: "July", style: "balanced" }));
  const [tempPlace, setTempPlace] = useState<Place | null>(null);

  function runExtraction() {
    setIntent(extractIntentLocally({ text: note, groupSize, ageRange, budget, nights, month, style }));
  }

  const rankedCities = useMemo(() => cities.map((city) => ({ city, result: scoreCity(city, intent) })).sort((a, b) => b.result.score - a.result.score), [intent]);

  const rankedPlaces = useMemo(() => {
    const allPlaces = tempPlace ? [...places, tempPlace] : places;
    const cityScores = new Map(rankedCities.map(({ city, result }) => [city.id, result.score]));
    return allPlaces.map((place) => ({ place, result: scorePlace(place, intent, cityScores.get(place.city_id) ?? 70) })).sort((a, b) => b.result.score - a.result.score);
  }, [intent, rankedCities, tempPlace]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-16">
      <header className="sticky top-0 z-50 -mx-4 border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button onClick={() => setPage("Overview")} className="text-left text-lg font-black tracking-tight text-white">Social Travel Intelligence OS</button>
          <nav className="flex gap-2 overflow-x-auto pb-1 md:max-w-[74vw] md:pb-0">
            {pages.map((item) => (
              <button key={item} onClick={() => setPage(item)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition ${page === item ? "bg-sky-200 text-slate-950" : "border border-white/10 bg-white/[0.045] text-slate-300 hover:border-sky-200/50"}`}>{item}</button>
            ))}
          </nav>
        </div>
      </header>

      {page === "Overview" && <Overview setPage={setPage} />}
      {page === "Traveler Intake" && <TravelerIntake {...{ note, setNote, groupSize, setGroupSize, ageRange, setAgeRange, budget, setBudget, nights, setNights, month, setMonth, style, setStyle, intent, setIntent, runExtraction }} />}
      {page === "Destinations" && <Destinations rankedCities={rankedCities} />}
      {page === "Places" && <Places rankedPlaces={rankedPlaces} setTempPlace={setTempPlace} />}
      {page === "Business Portal" && <BusinessPortal />}
      {page === "Image Definer" && <ImageDefiner />}
      {page === "Networking" && <Networking />}
      {page === "Itinerary" && <Itinerary rankedPlaces={rankedPlaces} rankedCities={rankedCities} />}
      {page === "Cost Model" && <CostModel />}
      {page === "Safety" && <Safety />}
      {page === "Architecture" && <Architecture />}
    </main>
  );
}

function Overview({ setPage }: { setPage: (page: Page) => void }) {
  const pipeline = ["Preference input", "Structured intent", "City matching", "Place matching", "Business confirmation", "Social opportunities", "Feedback calibration"];
  return (
    <section className="grid gap-6 py-12 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="pt-4">
        <Chip>Investor-facing production MVP</Chip>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] text-white md:text-7xl">Travel planning with social context, not shallow descriptions.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">A decision engine that turns messy human preference into structured city, neighborhood, place, event, and route recommendations.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => setPage("Traveler Intake")}>Try traveler intake</Button><GhostButton onClick={() => setPage("Destinations")}>Destination intelligence</GhostButton><GhostButton onClick={() => setPage("Places")}>Place intelligence</GhostButton><GhostButton onClick={() => setPage("Business Portal")}>Business portal</GhostButton></div>
      </div>
      <Card>
        <h2 className="text-3xl font-black tracking-tight text-white">Why it matters</h2>
        <p className="mt-3 text-slate-300">Descriptions like “cozy” or “good atmosphere” do not tell travelers whether a place is social, calm, international, laptop-friendly, good for groups, or useful for meeting people.</p>
        <div className="mt-5 grid gap-2">{pipeline.map((step, i) => <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm text-slate-300"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-200 font-black text-slate-950">{i + 1}</span>{step}</div>)}</div>
      </Card>
    </section>
  );
}

function TravelerIntake(props: any) {
  const { intent, setIntent } = props;
  const active = activeFeatureKeys(intent);
  return (
    <section className="py-10">
      <SectionHeader eyebrow="Preference engine" title="Traveler Preference Intake" body="Text or voice-style input becomes a validated intent object. Fields stay editable so the AI never becomes the final unchecked app state." />
      <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <FieldLabel>Natural language preference</FieldLabel>
          <textarea className="min-h-36 w-full rounded-2xl border border-white/10 bg-white/[0.065] p-4 leading-7 text-slate-100 outline-none placeholder:text-slate-500" value={props.note} onChange={(event) => props.setNote(event.target.value)} />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <LabeledInput label="Group size" type="number" value={props.groupSize} onChange={(v) => props.setGroupSize(Number(v))} />
            <LabeledInput label="Age range" value={props.ageRange} onChange={props.setAgeRange} />
            <LabeledInput label="Budget pp" type="number" value={props.budget} onChange={(v) => props.setBudget(Number(v))} />
            <LabeledInput label="Nights" type="number" value={props.nights} onChange={(v) => props.setNights(Number(v))} />
            <div><FieldLabel>Month</FieldLabel><select className="w-full rounded-xl border border-white/10 bg-white/[0.065] p-3 text-slate-100" value={props.month} onChange={(e) => props.setMonth(e.target.value)}>{months.map((m) => <option key={m}>{m}</option>)}</select></div>
            <div><FieldLabel>Style</FieldLabel><select className="w-full rounded-xl border border-white/10 bg-white/[0.065] p-3 text-slate-100" value={props.style} onChange={(e) => props.setStyle(e.target.value)}>{["balanced", "social", "nightlife", "culture", "food", "budget", "remote-work", "sports"].map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <Button className="mt-4" onClick={props.runExtraction}>Extract structured intent</Button>
          <h3 className="mt-7 text-lg font-black text-white">Feature toggles</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{featureKeys.map((feature) => <label key={feature} className="rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm text-slate-300"><input className="mr-2 accent-sky-200" type="checkbox" checked={intent.desired_features[feature]} onChange={(event) => setIntent({ ...intent, desired_features: { ...intent.desired_features, [feature]: event.target.checked } })} />{featureLabels[feature]}</label>)}</div>
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-3"><h2 className="text-2xl font-black text-white">Structured intent</h2><Chip tone="good">confidence {(intent.confidence.overall * 100).toFixed(0)}%</Chip></div>
          <div className="mt-4 flex flex-wrap gap-2">{active.map((feature) => <Chip key={feature}>{featureLabels[feature]}</Chip>)}{activeAvoid(intent).map((avoid) => <Chip key={avoid} tone="warn">avoid {avoid.replaceAll("_", " ")}</Chip>)}</div>
          <JsonPanel className="mt-4">{JSON.stringify(intent, null, 2)}</JsonPanel>
        </Card>
      </div>
    </section>
  );
}

function LabeledInput({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return <div><FieldLabel>{label}</FieldLabel><input className="w-full rounded-xl border border-white/10 bg-white/[0.065] p-3 text-slate-100" type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

function Destinations({ rankedCities }: any) {
  return (
    <section className="py-10">
      <SectionHeader eyebrow="Transparent scoring" title="Destination Intelligence" body="Scores react to the active intent and show the components behind the ranking." />
      <Card><div className="grid gap-3">{rankedCities.map(({ city, result }: any, index: number) => <ScoreBar key={city.id} label={`${index + 1}. ${city.name}`} score={result.score} meta={`${formatEuro(result.estimatedCost)} pp · ${city.best_neighborhoods.join(", ")}`} />)}</div></Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rankedCities.map(({ city, result }: any) => <SoftCard key={city.id}><div className="flex items-start justify-between gap-3"><h3 className="text-xl font-black text-white">{city.name}</h3><Chip tone="good">{result.score}/100</Chip></div><p className="mt-2 text-sm leading-6 text-slate-300">{city.notes}</p><p className="mt-3 text-sm text-slate-400"><strong className="text-white">Cost:</strong> {formatEuro(result.estimatedCost)} pp</p><p className="text-sm text-slate-400"><strong className="text-white">Neighborhoods:</strong> {city.best_neighborhoods.join(", ")}</p><div className="mt-3 flex flex-wrap gap-2">{city.risk_flags.map((risk: string) => <Chip key={risk} tone="warn">{risk}</Chip>)}</div><JsonPanel className="mt-3 max-h-64">{JSON.stringify(result.explanation, null, 2)}</JsonPanel></SoftCard>)}</div>
    </section>
  );
}

function Places({ rankedPlaces, setTempPlace }: any) {
  const [form, setForm] = useState({ name: "", city_id: "valencia", neighborhood: "", type: "cafe", price_level: 2, social_score: 80, evidence_score: 75, business_confirmed: false, notes: "" });
  return (
    <section className="py-10">
      <SectionHeader eyebrow="Venue intelligence" title="Place Intelligence" body="Recommendations for restaurants, cafés, bars, coworking, sports spots, third spaces, cultural places, and opt-in social events." />
      <Card><div className="grid gap-3">{rankedPlaces.slice(0, 8).map(({ place, result }: any, index: number) => <ScoreBar key={place.id} label={`${index + 1}. ${place.name}`} score={result.score} meta={`${place.type} · ${place.neighborhood}`} />)}</div></Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{rankedPlaces.map(({ place, result }: any) => <SoftCard key={place.id}><h3 className="text-xl font-black text-white">{place.name}</h3><p className="text-sm text-slate-400">{place.type} · {place.neighborhood}</p><div className="mt-2 flex flex-wrap gap-2"><Chip tone="good">{result.score}/100</Chip><Chip tone={place.business_confirmed ? "good" : "muted"}>{place.business_confirmed ? "business confirmed" : "not confirmed"}</Chip><Chip>{"€".repeat(place.price_level)}</Chip></div><p className="mt-3 text-sm leading-6 text-slate-300">{place.notes}</p><div className="mt-3 flex flex-wrap gap-2">{[...place.feature_tags, ...place.ambience_tags].map((tag) => <Chip key={tag}>{tag}</Chip>)}</div></SoftCard>)}</div>
      <Card className="mt-6"><h2 className="text-2xl font-black text-white">Temporary place simulator</h2><p className="mt-2 text-sm text-slate-400">Lives in local state only. Use it to compare an estimated venue against the current top list.</p><div className="mt-4 grid gap-3 md:grid-cols-4"><LabeledInput label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><div><FieldLabel>City</FieldLabel><select className="w-full rounded-xl border border-white/10 bg-white/[0.065] p-3" value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><LabeledInput label="Neighborhood" value={form.neighborhood} onChange={(v) => setForm({ ...form, neighborhood: v })} /><LabeledInput label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} /></div><Button className="mt-4" onClick={() => setTempPlace({ id: `temp-${Date.now()}`, name: form.name || "Temporary Place", type: form.type, city_id: form.city_id, neighborhood: form.neighborhood || "Custom", ambience_tags: ["user-estimated"], feature_tags: ["young_adults", "international_crowd"], price_level: form.price_level as any, social_ambience_score: form.social_score, evidence_confidence_score: form.evidence_score, business_confirmed: form.business_confirmed, good_for: ["groups", "meeting people"], notes: form.notes || "Temporary custom place." })}>Add temporary place</Button></Card>
    </section>
  );
}

function BusinessPortal() { return <RichInfo title="Business Portal / Ambience Confirmation UI" eyebrow="Business reality layer" points={["Identity, links, opening hours, price range, and languages spoken.", "Ambience profile: quiet/social/loud, local/tourist/mixed, good for groups, solo travelers, remote work, sports, pre-drinks, and after-club food.", "Feature confirmation: matcha, specialty coffee, seafood, baked goods, cocktails, sports TV, live music, terrace, halal, late-night food.", "Proof media uploads require authentication and ownership/consent in production."]} />; }
function ImageDefiner() { return <RichInfo title="Image-Based Place Definer" eyebrow="Safe venue-level analysis" points={["Local preview and simulated tags in the prototype.", "Future endpoint can extract place type, ambience, group-friendliness, laptop-friendliness, terrace, sports TV, matcha, baked goods, seafood, and old-town cues.", "Never identify private individuals, infer sensitive traits, or rank attractiveness.", "Use safe wording: group-friendly, social ambience, high-energy, quiet, laptop-friendly."]} />; }
function Networking() { return <SimpleList title="Best opt-in environments to meet international people" items={events.map((e) => `${e.name} — ${e.category}`)} />; }
function Itinerary({ rankedPlaces, rankedCities }: any) { return <SimpleList title="Itinerary / Social Route Generator" items={[`Day 1: arrival + low-pressure dinner in ${rankedCities[0]?.city.name}`, "Afternoon: cultural/historic walk", `Evening: ${rankedPlaces[0]?.place.name}`, "Night: opt-in bar/event, not individual people", "Recovery window: calm café or terrace third space"]} />; }
function CostModel() { return <RichInfo title="Cost Model" eyebrow="Investor planning" points={["Inputs: monthly active users, voice notes, image analyses, LLM recommendations, places, businesses, storage, and API multiplier.", "Outputs: hosting, database/storage, voice transcription, image analysis, LLM reasoning, maps/place API, and total monthly estimate.", "Cost-control rule: analyze once, store structured tags, reuse forever."]} />; }
function Safety() { return <SimpleList title="Trust, Safety, and Compliance" items={["Prototype only; production needs privacy policy", "No sensitive trait inference", "No private individual identification", "No attractiveness ranking", "Business images require ownership or consent", "Faces blurred in production", "Networking recommendations are opt-in events only", "GitHub Pages is demo hosting, not production SaaS"]} />; }
function Architecture() { return <RichInfo title="Architecture / Product Roadmap" eyebrow="Production system" points={["LLM translates messy human preference into structured intent.", "Database stores verified place reality, claims, images, events, recommendations, and feedback.", "Image model detects venue features and ambience evidence, not people identity.", "Business UI confirms reality; scoring engine makes transparent decisions; feedback loop calibrates outcomes."]} />; }

function RichInfo({ title, eyebrow, points }: { title: string; eyebrow: string; points: string[] }) { return <section className="py-10"><SectionHeader eyebrow={eyebrow} title={title} /><div className="grid gap-4 md:grid-cols-2">{points.map((point) => <SoftCard key={point}><p className="leading-7 text-slate-300">{point}</p></SoftCard>)}</div></section>; }
function SimpleList({ title, items }: { title: string; items: string[] }) { return <section className="py-10"><SectionHeader title={title} /><div className="grid gap-3 md:grid-cols-2">{items.map((item) => <SoftCard key={item}><p className="text-slate-300">{item}</p></SoftCard>)}</div></section>; }
