"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Button, Card, Chip, CollapsibleJson, FieldLabel, MetricBar, SectionHeader, SoftCard, StatPill } from "@/components/ui";

type RankedCity = {
  city: {
    id: string;
    name: string;
    country: string;
    history_score: number;
    nightlife_score: number;
    social_density_score: number;
    food_culture_score: number;
    mobility_score: number;
    sea_access: boolean;
    best_neighborhoods: string[];
    notes: string;
  };
  result: { score: number; estimatedCost: number; explanation: Record<string, number | string[] | string> };
};

type RankedPlace = {
  place: {
    id: string;
    name: string;
    type: string;
    city_id: string;
    neighborhood: string;
    feature_tags: string[];
    ambience_tags: string[];
    good_for: string[];
    business_confirmed: boolean;
    evidence_confidence_score: number;
    notes: string;
  };
  result: { score: number; explanation: Record<string, number> };
};

function labelize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

export function DecisionBoardPanel({ rankedCities }: { rankedCities: RankedCity[] }) {
  const [weights, setWeights] = useState({ culture: 70, nightlife: 72, budget: 68, social: 85, food: 74, mobility: 62 });

  const board = useMemo(() => {
    return rankedCities
      .map(({ city, result }) => {
        const budgetSignal = Math.max(0, 100 - Math.max(0, result.estimatedCost - 800) / 8);
        const adjusted =
          result.score * 0.35 +
          city.history_score * (weights.culture / 100) * 0.13 +
          city.nightlife_score * (weights.nightlife / 100) * 0.13 +
          budgetSignal * (weights.budget / 100) * 0.12 +
          city.social_density_score * (weights.social / 100) * 0.15 +
          city.food_culture_score * (weights.food / 100) * 0.07 +
          city.mobility_score * (weights.mobility / 100) * 0.05;
        return { city, result, adjusted: Math.round(adjusted) };
      })
      .sort((a, b) => b.adjusted - a.adjusted);
  }, [rankedCities, weights]);

  const winner = board[0];

  return (
    <section className="py-10">
      <SectionHeader
        eyebrow="Decision board"
        title="Group decision cockpit"
        body="A practical layer for group trips: tune what the group actually values and watch the recommended city shift. This is not another list; it is a decision instrument."
      />
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-2xl font-black text-white">Group priorities</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use this when five people all want slightly different things. It turns the group argument into visible tradeoffs.</p>
          <div className="mt-5 grid gap-4">
            {(Object.entries(weights) as [keyof typeof weights, number][]).map(([key, value]) => (
              <label key={key} className="grid gap-2">
                <div className="flex items-center justify-between text-sm font-bold text-slate-300"><span>{labelize(key)}</span><span>{value}</span></div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  className="accent-sky-200"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setWeights((prev) => ({ ...prev, [key]: Number(event.target.value) }))}
                />
              </label>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">Current winner</h2>
              <p className="mt-1 text-sm text-slate-400">Adjusted for the group’s live priorities.</p>
            </div>
            <Chip tone="good">{winner?.adjusted ?? 0}/100</Chip>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <StatPill label="City" value={winner?.city.name ?? "—"} note={winner?.city.country ?? ""} />
            <StatPill label="Cost" value={`€${winner?.result.estimatedCost ?? 0}`} note="estimated pp" />
            <StatPill label="Best zone" value={winner?.city.best_neighborhoods[0] ?? "—"} note="starting neighborhood" />
          </div>
          <div className="mt-5 grid gap-3">
            {board.slice(0, 5).map((item) => <MetricBar key={item.city.id} label={item.city.name} score={item.adjusted} />)}
          </div>
        </Card>
      </div>
    </section>
  );
}

export function OpportunityRadarPanel({ rankedCities, rankedPlaces }: { rankedCities: RankedCity[]; rankedPlaces: RankedPlace[] }) {
  const topCity = rankedCities[0]?.city;
  const topPlaces = rankedPlaces.slice(0, 4);
  const confirmed = rankedPlaces.filter((item) => item.place.business_confirmed).length;
  const socialPlaces = rankedPlaces.filter((item) => item.place.good_for.some((useCase) => /meeting|groups|pre-drinks|solo/i.test(useCase))).length;

  return (
    <section className="py-10">
      <SectionHeader eyebrow="Opportunity radar" title="Where the trip has the highest probability of working" body="A founder-facing synthesis panel: it compresses destination, place, evidence, and social-opportunity signals into a decision narrative." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatPill label="Best destination" value={topCity?.name ?? "—"} note={topCity?.best_neighborhoods.slice(0, 2).join(" + ") ?? ""} />
        <StatPill label="Strong places" value={topPlaces.length} note="above current threshold" />
        <StatPill label="Confirmed venues" value={confirmed} note="business-confirmed seed records" />
        <StatPill label="Social contexts" value={socialPlaces} note="places good for groups/meeting" />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-black text-white">Trip thesis</h2>
          <p className="mt-3 leading-7 text-slate-300">
            Start from <strong className="text-white">{topCity?.best_neighborhoods[0] ?? "the top neighborhood"}</strong>, anchor the trip around two high-confidence places, then add one opt-in social context per day. Avoid trying to optimize every hour.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">{topPlaces.flatMap((item) => item.place.feature_tags).slice(0, 10).map((tag) => <Chip key={tag}>{labelize(tag)}</Chip>)}</div>
        </Card>
        <Card>
          <h2 className="text-2xl font-black text-white">System confidence</h2>
          <div className="mt-5 grid gap-4">
            <MetricBar label="Destination confidence" score={rankedCities[0]?.result.score ?? 0} />
            <MetricBar label="Place evidence" score={Math.round(topPlaces.reduce((sum, item) => sum + item.place.evidence_confidence_score, 0) / Math.max(1, topPlaces.length))} />
            <MetricBar label="Business confirmation" score={Math.round((confirmed / Math.max(1, rankedPlaces.length)) * 100)} />
            <MetricBar label="Social route density" score={Math.min(100, socialPlaces * 18)} />
          </div>
        </Card>
      </div>
    </section>
  );
}

export function RouteGeneratorPanel({ rankedCities, rankedPlaces }: { rankedCities: RankedCity[]; rankedPlaces: RankedPlace[] }) {
  const city = rankedCities[0]?.city;
  const primaryPlaces = rankedPlaces.slice(0, 5);
  const days = [
    { theme: "Arrival + low-pressure social night", morning: "Travel / check-in", afternoon: city?.best_neighborhoods[0] ?? "orientation walk", evening: primaryPlaces[0]?.place.name ?? "group dinner", night: "casual bar, no hard social pressure" },
    { theme: "Culture + seafood + social bar", morning: city?.best_neighborhoods[1] ?? "old town", afternoon: "historic/cultural block", evening: primaryPlaces[1]?.place.name ?? "local restaurant", night: primaryPlaces[2]?.place.name ?? "international bar" },
    { theme: "Recovery + opt-in networking", morning: "slow café / late breakfast", afternoon: primaryPlaces[3]?.place.name ?? "coworking or third space", evening: "food market / terrace", night: "language exchange or open mic" },
    { theme: "Peak social night", morning: "beach or light sports", afternoon: "rest window", evening: primaryPlaces[0]?.place.name ?? "group dinner", night: "club/bar zone if energy is high" }
  ];

  return (
    <section className="py-10">
      <SectionHeader eyebrow="Social route generator" title="A route that protects energy, budget, and social probability" body="The MVP should not only rank options; it should compose them into a usable day-by-day operating plan." />
      <div className="grid gap-4 md:grid-cols-2">
        {days.map((day, index) => (
          <Card key={day.theme}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Day {index + 1}</p><h2 className="mt-1 text-2xl font-black text-white">{day.theme}</h2></div>
              <Chip tone={index === 3 ? "warn" : "good"}>{index === 3 ? "high intensity" : "balanced"}</Chip>
            </div>
            <div className="mt-5 grid gap-3">
              <RouteBlock label="Morning" value={day.morning} />
              <RouteBlock label="Afternoon" value={day.afternoon} />
              <RouteBlock label="Evening" value={day.evening} />
              <RouteBlock label="Night" value={day.night} />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function RouteBlock({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-200">{value}</p></div>;
}

export function BusinessPortalPanel() {
  const [profile, setProfile] = useState({ name: "", type: "cafe", social: 75, quiet: 35, laptop: 60, groups: true, sports: false, matcha: true, seafood: false });
  const generated = {
    place_type: [profile.type, profile.laptop > 55 ? "third_space" : "venue"],
    ambience: { social: profile.social / 100, quiet: profile.quiet / 100, laptop_friendly: profile.laptop / 100 },
    features: { matcha: profile.matcha, seafood: profile.seafood, sports_tv: profile.sports, group_friendly: profile.groups },
    evidence: { business_confirmed: true, media_consent_required: true, production_upload_only_after_auth: true }
  };

  return (
    <section className="py-10">
      <SectionHeader eyebrow="Business reality layer" title="Business Portal / Ambience Confirmation" body="This is where businesses stop saying vague things like ‘cozy’ and start confirming the social reality of their place." />
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="grid gap-3">
            <div><FieldLabel>Business name</FieldLabel><input className="w-full rounded-xl border border-white/10 bg-white/[0.065] p-3" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="e.g. Ruzafa Social Café" /></div>
            <div><FieldLabel>Type</FieldLabel><select className="w-full rounded-xl border border-white/10 bg-white/[0.065] p-3" value={profile.type} onChange={(event) => setProfile({ ...profile, type: event.target.value })}><option>cafe</option><option>restaurant</option><option>bar</option><option>coworking</option><option>third_space</option><option>sports_bar</option></select></div>
            <MetricInput label="Social energy" value={profile.social} onChange={(value) => setProfile({ ...profile, social: value })} />
            <MetricInput label="Quietness" value={profile.quiet} onChange={(value) => setProfile({ ...profile, quiet: value })} />
            <MetricInput label="Laptop friendliness" value={profile.laptop} onChange={(value) => setProfile({ ...profile, laptop: value })} />
            <div className="grid gap-2 sm:grid-cols-2">
              {(["groups", "sports", "matcha", "seafood"] as const).map((key) => <label key={key} className="rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm text-slate-300"><input type="checkbox" className="mr-2 accent-sky-200" checked={Boolean(profile[key])} onChange={(event) => setProfile({ ...profile, [key]: event.target.checked })} />{labelize(key)}</label>)}
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-black text-white">Generated business profile</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">This is how the raw business claim becomes searchable social-place intelligence.</p>
          <div className="mt-5 grid gap-4"><MetricBar label="Social energy" score={profile.social} /><MetricBar label="Quiet suitability" score={profile.quiet} /><MetricBar label="Laptop friendliness" score={profile.laptop} /></div>
          <div className="mt-5 flex flex-wrap gap-2">{Object.entries(generated.features).filter(([, enabled]) => enabled).map(([key]) => <Chip key={key} tone="good">{labelize(key)}</Chip>)}</div>
          <CollapsibleJson label="View generated profile data">{JSON.stringify(generated, null, 2)}</CollapsibleJson>
        </Card>
      </div>
    </section>
  );
}

function MetricInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="grid gap-2"><div className="flex items-center justify-between text-sm font-bold text-slate-300"><span>{label}</span><span>{value}</span></div><input type="range" min={0} max={100} value={value} className="accent-sky-200" onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

export function ImageDefinerPanel() {
  const [files, setFiles] = useState<string[]>([]);
  const simulated = {
    place_type: files.length > 0 ? ["cafe", "third_space"] : ["unknown"],
    ambience: files.length > 0 ? ["warm", "social", "medium-energy"] : [],
    confidence: { group_friendliness: files.length ? 82 : 0, laptop_friendliness: files.length ? 64 : 0, terrace_visible: files.length ? 71 : 0, baked_goods_visible: files.length ? 76 : 0 },
    safety: ["no face recognition", "no sensitive traits", "venue-level features only"]
  };

  return (
    <section className="py-10">
      <SectionHeader eyebrow="Image-based place definer" title="Turn weak venue photos into structured ambience evidence" body="Prototype-only local file names. Production would upload after auth, blur faces, and analyze venue-level features only." />
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <FieldLabel>Local image preview input</FieldLabel>
          <input type="file" multiple accept="image/*" className="w-full rounded-xl border border-white/10 bg-white/[0.065] p-3" onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => file.name))} />
          <div className="mt-4 grid gap-2">{files.length ? files.map((file) => <div key={file} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm text-slate-300">{file}</div>) : <p className="text-sm text-slate-400">No files selected. Nothing is uploaded in this prototype.</p>}</div>
        </Card>
        <Card>
          <h2 className="text-2xl font-black text-white">Simulated venue-level output</h2>
          <div className="mt-5 grid gap-4">{Object.entries(simulated.confidence).map(([key, value]) => <MetricBar key={key} label={labelize(key)} score={value} />)}</div>
          <div className="mt-5 flex flex-wrap gap-2">{simulated.ambience.map((tag) => <Chip key={tag}>{tag}</Chip>)}{simulated.safety.map((rule) => <Chip key={rule} tone="warn">{rule}</Chip>)}</div>
          <CollapsibleJson label="View simulated image analysis data">{JSON.stringify(simulated, null, 2)}</CollapsibleJson>
        </Card>
      </div>
    </section>
  );
}

export function NetworkingPanel() {
  const items = ["Language exchange", "Beach volleyball", "Startup meetup", "Football viewing night", "Open mic", "Food tour", "Board-game café", "Coworking social hour"];
  return (
    <section className="py-10">
      <SectionHeader eyebrow="Opt-in social contexts" title="Networking without becoming creepy" body="The product should recommend environments, not individual people. This keeps it useful, safe, and socially acceptable." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{items.map((item, index) => <SoftCard key={item}><Chip tone="good">#{index + 1}</Chip><h3 className="mt-3 text-lg font-black text-white">{item}</h3><p className="mt-2 text-sm leading-6 text-slate-400">Opt-in context for meeting international people without scraping profiles or targeting individuals.</p></SoftCard>)}</div>
    </section>
  );
}
"}}() jriamanitra? // function name? invalid? Need handle JSON string carefully. I see extra weird at end `