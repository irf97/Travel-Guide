"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { continents, type Continent } from "@/lib/world-data";
import { getAllCityIntelligence, type CityIntelligence } from "@/lib/city-intelligence";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity } from "@/lib/scoring";
import type { AvoidKey, FeatureKey, TravelStyle } from "@/lib/types";
import { Real3DGlobe } from "@/components/real-3d-globe";
import s from "./world-command.module.css";

type TopN = 10 | 25 | 50 | 100;
type Ranked = { city: CityIntelligence; score: number; cost: number; globalRank: number; continentRank: number; featureFit: number; riskPenalty: number; seasonality: number; memoryBoost: number };
type SaveState = "idle" | "saving" | "saved" | "fallback" | "error";
type MemorySummary = { favoriteCityIds: string[]; rejectedCityIds: string[]; preferredBudget: string | null; preferredGoal: string | null; preferredMonth: string | null; eventCount: number; savedTripCount: number };
type CityIntel = { weather?: { temperatureC: number | null; precipitationProbability: number | null; windSpeedKmh: number | null; comfortScore: number }; pulse?: { articleCount: number; riskScore: number; momentumScore: number; demandPressureScore: number; confidence: string }; venueDensity?: { bars: number; restaurants: number; clubs: number; socialSurfaceArea: number; confidence: string }; derived?: { outdoorNightlifeScore: number; tourismDemandProxy: number; confidence: string } };

const monthOptions = ["March", "April", "May", "June", "July", "August", "September", "October"];
const travelStyleOptions: Array<{ label: string; value: TravelStyle }> = [
  { label: "Balanced", value: "balanced" }, { label: "Social", value: "social" }, { label: "Nightlife", value: "nightlife" }, { label: "Culture", value: "culture" }, { label: "Food", value: "food" }, { label: "Budget", value: "budget" }, { label: "Digital Nomad", value: "remote-work" }
];
const featureOptions: Array<{ label: string; value: FeatureKey }> = [
  { label: "Nightlife", value: "bars" }, { label: "Clubs", value: "clubs" }, { label: "Food Culture", value: "local_food" }, { label: "Historic", value: "historic" }, { label: "Sea", value: "sea" }, { label: "International", value: "international_crowd" }, { label: "Young adults", value: "young_adults" }, { label: "Coworking", value: "coworking" }
];
const avoidOptions: Array<{ label: string; value: AvoidKey }> = [
  { label: "Too Crowded", value: "too_crowded" }, { label: "Tourist Traps", value: "tourist_traps" }, { label: "Expensive", value: "expensive" }, { label: "Car Dependent", value: "car_dependent" }, { label: "Dead Nightlife", value: "dead_nightlife" }
];

function makeIntent(input: { budget: number; nights: number; month: string; travelStyles: TravelStyle[]; features: FeatureKey[]; avoid: AvoidKey[] }) {
  const intent = defaultIntent();
  intent.budget.per_person_eur = input.budget;
  intent.budget.sensitivity = input.budget <= 800 ? "high" : input.budget <= 1300 ? "medium" : "low";
  intent.dates.month = input.month;
  intent.dates.nights = input.nights;
  intent.travel_style = input.travelStyles.length ? input.travelStyles : ["balanced"];
  Object.keys(intent.desired_features).forEach((key) => { intent.desired_features[key as FeatureKey] = false; });
  input.features.forEach((feature) => { intent.desired_features[feature] = true; });
  Object.keys(intent.avoid).forEach((key) => { intent.avoid[key as AvoidKey] = false; });
  input.avoid.forEach((avoid) => { intent.avoid[avoid] = true; });
  return intent;
}
function toggleValue<T extends string>(items: T[], value: T) { return items.includes(value) ? items.filter((item) => item !== value) : [...items, value]; }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }

export function WorldCommandCenter() {
  const storedCities = useMemo(() => getAllCityIntelligence(), []);
  const [continent, setContinent] = useState<Continent | "All">("All");
  const [topN, setTopN] = useState<TopN>(25);
  const [selectedId, setSelectedId] = useState("istanbul-turkiye");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [budget, setBudget] = useState(1000);
  const [nights, setNights] = useState(14);
  const [month, setMonth] = useState("July");
  const [travelStyles, setTravelStyles] = useState<TravelStyle[]>(["social", "culture", "food"]);
  const [features, setFeatures] = useState<FeatureKey[]>(["bars", "local_food", "historic", "international_crowd", "young_adults"]);
  const [avoid, setAvoid] = useState<AvoidKey[]>(["car_dependent"]);
  const [query, setQuery] = useState("");
  const [memory, setMemory] = useState<MemorySummary | null>(null);
  const [intel, setIntel] = useState<CityIntel | null>(null);
  const [showStoredPulse, setShowStoredPulse] = useState(false);

  const intent = useMemo(() => makeIntent({ budget, nights, month, travelStyles, features, avoid }), [budget, nights, month, travelStyles, features, avoid]);

  useEffect(() => { fetch("/api/memory").then((r) => r.json()).then((j) => setMemory(j?.data?.memory ?? null)).catch(() => setMemory(null)); }, []);

  const ranked = useMemo<Ranked[]>(() => {
    const q = query.trim().toLowerCase();
    const favorites = new Set(memory?.favoriteCityIds ?? []);
    const rejected = new Set(memory?.rejectedCityIds ?? []);
    const pool = q ? storedCities.filter((city) => `${city.name} ${city.country} ${city.continent} ${city.types.join(" ")} ${city.best_neighborhoods.join(" ")}`.toLowerCase().includes(q)) : storedCities;
    const base = pool.map((city) => {
      const result = scoreCity(city, intent);
      const memoryBoost = favorites.has(city.id) ? 6 : rejected.has(city.id) ? -12 : 0;
      const storedBoost = Math.round((city.pulse.demandPressure - 50) * 0.04 + (city.venues.densityScore - 50) * 0.04 + (city.tourism.cityTourismDemandScore - 50) * 0.04);
      return { city, score: clamp(result.score + memoryBoost + storedBoost), cost: result.estimatedCost, featureFit: result.featureFit, riskPenalty: result.riskPenalty, seasonality: result.seasonality, memoryBoost };
    }).sort((a, b) => b.score - a.score);
    const counts = new Map<string, number>();
    return base.map((item, i) => { const n = (counts.get(item.city.continent) ?? 0) + 1; counts.set(item.city.continent, n); return { ...item, globalRank: i + 1, continentRank: n }; });
  }, [intent, query, memory, storedCities]);

  const visible = ranked.filter((x) => continent === "All" || x.city.continent === continent).slice(0, topN);
  const selected = ranked.find((x) => x.city.id === selectedId) ?? visible[0] ?? ranked[0];
  const topCities = visible.slice(0, 5);
  const activeFilters = `${month} · €${budget} · ${nights} nights · ${travelStyles.join("/") || "balanced"}`;

  useEffect(() => {
    if (!selected) return;
    setShowStoredPulse(false);
    fetch("/api/memory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "city_view", cityId: selected.city.id, metadata: { source: "world", score: selected.score } }) }).catch(() => {});
    const params = new URLSearchParams({ city: selected.city.name, lat: String(selected.city.lat), lng: String(selected.city.lng), nightlifeScore: String(selected.city.nightlife_score), foodScore: String(selected.city.food_culture_score), socialScore: String(selected.city.social_density_score) });
    fetch(`/api/live/city-intelligence?${params.toString()}`).then((r) => r.json()).then((j) => setIntel(j?.data ?? null)).catch(() => setIntel(null));
  }, [selected?.city.id]);

  async function recordMemory(eventType: "city_favorite" | "city_reject" | "city_select") {
    if (!selected) return;
    await fetch("/api/memory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType, cityId: selected.city.id, metadata: { score: selected.score, filters: activeFilters } }) }).catch(() => {});
    const refreshed = await fetch("/api/memory").then((r) => r.json()).catch(() => null);
    setMemory(refreshed?.data?.memory ?? memory);
    setSaveMessage(eventType === "city_reject" ? "City downranked in anonymous memory." : eventType === "city_favorite" ? "City favorited in anonymous memory." : "City selection remembered.");
    setSaveState("saved");
  }

  async function saveSelectedTrip() {
    if (!selected) return;
    setSaveState("saving"); setSaveMessage("Saving selected city...");
    try {
      const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `${selected.city.name}, ${selected.city.country}`, cityId: selected.city.id, month, budgetLevel: budget <= 800 ? "Low" : budget <= 1300 ? "Medium" : "High", goal: travelStyles.join("-") || "balanced", computedScore: selected.score, notes: `Saved from /world. Filters: ${activeFilters}. Global rank #${selected.globalRank}; continent rank #${selected.continentRank}. Estimated cost €${selected.cost}. Feature fit ${selected.featureFit}. Risk penalty ${selected.riskPenalty}. Memory boost ${selected.memoryBoost}. Stored pulse ${selected.city.pulse.demandPressure}. Desired: ${features.join(", ")}. Avoid: ${avoid.join(", ")}.` }) });
      const json = await response.json(); const status = json?.data?.status;
      setSaveState(status === "live" ? "saved" : "fallback"); setSaveMessage(json?.data?.message ?? "Trip saved.");
      await recordMemory("city_select");
    } catch (error) { setSaveState("error"); setSaveMessage(error instanceof Error ? error.message : "Save failed."); }
  }

  return <main className={s.shell}>
    <div className={s.space}><div className={s.stars} /></div>
    <nav className={s.nav}>
      <Link href="/portal" className={s.brand}><span className={s.logo}/><span>SOCIAL TRAVEL<br/><span style={{fontWeight:600,letterSpacing:".08em"}}>INTELLIGENCE OS</span></span></Link>
      <div className={s.tabs}><span className={`${s.tab} ${s.tabActive}`}>World Intelligence</span><Link className={s.tab} href="/rankings">Rankings</Link><Link className={s.tab} href="/lab">Comparisons</Link><Link className={s.tab} href="/trips">Saved Trips</Link><Link className={s.tab} href="/portal">Command Hub</Link></div>
      <div className={s.rightNav}><input className={s.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cities, neighborhoods..."/><div className={s.avatar}>I</div></div>
    </nav>
    <section className={s.layout}>
      <aside className={`${s.panel} ${s.left}`}>
        <div className={s.panelTitle}><span className={s.icon}>⌖</span>Explore the world</div>
        <Control icon="🌐" title="Continent"><div className={s.selectLine}><span>{continent === "All" ? "All Continents" : continent}</span><span>⌄</span></div><div className={s.pills} style={{marginTop:10}}><Pill active={continent === "All"} onClick={() => setContinent("All")}>All</Pill>{continents.map(c => <Pill key={c} active={continent === c} onClick={() => setContinent(c)}>{c}</Pill>)}</div></Control>
        <Control icon="〽" title="Budget"><div className={s.rangeLabels}><span>€500</span><span>€{budget}</span><span>€2500+</span></div><input className={s.range} type="range" min={500} max={2500} step={50} value={budget} onChange={(event)=>setBudget(Number(event.target.value))}/></Control>
        <Control icon="▣" title="Month"><div className={s.pills}>{monthOptions.map((option)=><Pill key={option} active={month===option} onClick={()=>setMonth(option)}>{option.slice(0,3)}</Pill>)}</div></Control>
        <Control icon="▤" title="Stay length"><div className={s.rangeLabels}><span>3</span><span>{nights} nights</span><span>30</span></div><input className={s.range} type="range" min={3} max={30} step={1} value={nights} onChange={(event)=>setNights(Number(event.target.value))}/></Control>
        <Control icon="✈" title="Travel style"><div className={s.pills}>{travelStyleOptions.map((option)=><Pill key={option.value} active={travelStyles.includes(option.value)} onClick={()=>setTravelStyles(toggleValue(travelStyles, option.value))}>{option.label}</Pill>)}</div></Control>
        <Control icon="☆" title="Desired features"><div className={s.pills}>{featureOptions.map((option)=><Pill key={option.value} active={features.includes(option.value)} onClick={()=>setFeatures(toggleValue(features, option.value))}>{option.label}</Pill>)}</div></Control>
        <Control icon="🛡" title="Avoidances"><div className={s.pills}>{avoidOptions.map((option)=><Pill key={option.value} active={avoid.includes(option.value)} onClick={()=>setAvoid(toggleValue(avoid, option.value))}>{option.label}</Pill>)}</div></Control>
        <Control icon="🏆" title="Ranking depth"><div className={s.pills}>{([10,25,50,100] as TopN[]).map(n=><Pill key={n} active={topN===n} onClick={()=>setTopN(n)}>Top {n}</Pill>)}</div></Control>
        <button className={s.scan} onClick={()=>visible[0] && setSelectedId(visible[0].city.id)}>Run world scan</button>
        <a className={s.scan} style={{display:"block", textAlign:"center", textDecoration:"none", marginTop:10}} href="/rankings">Open full ranking page</a>
        <div style={{marginTop:10,fontSize:11,lineHeight:1.5,color:"#94a3b8"}}>Ranking uses controls + anonymous memory + stored city intelligence. Live checks are debug-only.</div>
      </aside>
      <section className={s.stage}>
        <button className={`${s.floatStat} ${s.pulse}`} onClick={() => setShowStoredPulse((value) => !value)} style={{textAlign:"left", cursor:"pointer"}}><div className={s.statLabel}>Stored city pulse<br/>Click for detail</div><div style={{display:"flex",alignItems:"center",gap:12}}><div className={s.spark}/><div className={s.statValue}>{selected?.city.pulse.demandPressure ?? visible[0]?.score ?? 0}</div></div></button>
        <div className={`${s.floatStat} ${s.analyzed}`}><div className={s.statLabel}>Cities matched</div><div style={{fontSize:30,fontWeight:950}}>{visible.length}</div><div style={{fontSize:11,color:"#86efac"}}>● Memory + stored intelligence</div></div>
        <Real3DGlobe cities={visible} selectedId={selected?.city.id ?? ""} onSelect={setSelectedId}/>
        {showStoredPulse && selected ? <div style={{position:"absolute",left:"50%",bottom:32,transform:"translateX(-50%)",width:"min(560px, calc(100vw - 2rem))",border:"1px solid rgba(125,211,252,.28)",background:"rgba(15,23,42,.86)",backdropFilter:"blur(18px)",borderRadius:24,padding:18,zIndex:6,boxShadow:"0 24px 80px rgba(0,0,0,.35)"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12}}><div><div className={s.statLabel}>Stored pulse for {selected.city.name}</div><h3 style={{fontSize:22,fontWeight:950}}>Demand {selected.city.pulse.demandPressure} · Momentum {selected.city.pulse.eventMomentum}</h3></div><button className={s.pill} onClick={()=>setShowStoredPulse(false)}>Close</button></div>
          <p style={{marginTop:10,fontSize:13,lineHeight:1.6,color:"#cbd5e1"}}>{selected.city.pulse.explanation}</p>
          <div style={{marginTop:12,display:"grid",gap:8}}>{selected.city.pulse.headlines.map((headline)=><div key={headline} style={{border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",borderRadius:14,padding:"9px 11px",fontSize:12,color:"#e2e8f0"}}>{headline}</div>)}</div>
        </div> : null}
      </section>
      <aside className={`${s.panel} ${s.right}`}>
        <div className={s.panelTitle}><span className={s.icon}>◉</span>Selected city <span style={{marginLeft:"auto"}}>{selected?.city.visuals.flag}</span></div>
        <div className={s.cityHero}/>
        <div className={s.rightBody}>{selected ? <>
          <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start"}}><div><h2 style={{fontSize:24,fontWeight:950}}>{selected.city.name}, {selected.city.country}</h2><p style={{fontSize:12,color:"#93c5fd"}}>⌖ {selected.city.continent} • {activeFilters}</p></div><div className={s.scoreRing}>{selected.score}<span style={{fontSize:11,fontWeight:700}}>/100</span></div></div>
          <div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}><button className={s.scan} style={{margin:0}} onClick={saveSelectedTrip} disabled={saveState === "saving"}>{saveState === "saving" ? "Saving..." : "Save trip"}</button><button className={s.pill} onClick={()=>recordMemory("city_favorite")}>Favorite</button><button className={s.pill} onClick={()=>recordMemory("city_reject")}>Reject</button><a className={s.pill} href={`/cities/${selected.city.id}`}>City page</a><Link className={s.pill} href="/trips">View trips</Link></div>
          {saveMessage ? <div style={{marginTop:10,border:"1px solid rgba(255,255,255,.12)",borderRadius:14,padding:"10px 12px",fontSize:12,color:saveState === "error" ? "#fca5a5" : saveState === "fallback" ? "#fde68a" : "#bbf7d0",background:"rgba(15,23,42,.55)"}}>{saveMessage}</div> : null}
          <div style={{marginTop:12,display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>{selected.city.visuals.slides.map((slide)=><div key={slide.kind} style={{minWidth:112,border:"1px solid rgba(255,255,255,.1)",background:"rgba(15,23,42,.52)",borderRadius:16,padding:10}}><div style={{fontSize:26}}>{slide.label}</div><div style={{marginTop:5,fontSize:11,fontWeight:900}}>{slide.title}</div></div>)}</div>
          <div style={{marginTop:14,display:"grid",gap:10}}><Score label="Nightlife" value={selected.city.nightlife_score}/><Score label="Social Density" value={selected.city.social_density_score}/><Score label="Stored Pulse" value={selected.city.pulse.demandPressure}/><Score label="Venue Density" value={selected.city.venues.densityScore}/><Score label="Feature Fit" value={selected.featureFit}/><Score label="Seasonality" value={selected.seasonality}/><Score label="Memory Boost" value={50 + selected.memoryBoost}/>{intel?.weather ? <Score label="Live Weather Debug" value={intel.weather.comfortScore}/> : null}</div>
          <div className={s.rankCards} style={{marginTop:16}}><div className={s.rankCard}><div className={s.statLabel}>Stored tourism</div><div style={{fontSize:18,fontWeight:950}}>{selected.city.tourism.cityTourismDemandScore}</div><div style={{fontSize:11,color:"#94a3b8"}}>Intl {selected.city.tourism.internationalTouristPressure}</div></div><div className={s.rankCard}><div className={s.statLabel}>Stored pulse</div><div style={{fontSize:18,fontWeight:950}}>{selected.city.pulse.articleCount} articles</div><div style={{fontSize:11,color:"#94a3b8"}}>Risk {selected.city.pulse.riskScore}</div></div><div className={s.rankCard}><div className={s.statLabel}>Venue model</div><div style={{fontSize:18,fontWeight:950}}>{selected.city.venues.bars} bars</div><div style={{fontSize:11,color:"#94a3b8"}}>{selected.city.venues.clubs} clubs</div></div></div>
          <button className={s.scan} style={{marginTop:12,width:"100%"}} onClick={()=>setShowStoredPulse(true)}>Open stored pulse detail</button>
          <div style={{marginTop:18}}><div className={s.controlHead} style={{justifyContent:"space-between"}}><span>Top filtered cities</span><span style={{color:"#67e8f9"}}>Risk penalty {selected.riskPenalty}</span></div>{topCities.map((x,i)=><button key={x.city.id} onClick={()=>setSelectedId(x.city.id)} className={`${s.topCity} ${x.city.id===selected.city.id?s.topCityActive:""}`}><span>{i+1}</span><span>{x.city.visuals.flag} {x.city.name}</span><b>{x.score}</b></button>)}</div>
          <div style={{marginTop:18}}><div className={s.controlHead}>Matching neighborhoods</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{selected.city.best_neighborhoods.slice(0,3).map((n,i)=><div key={n} className={s.rankCard} style={{padding:8}}><div style={{height:54,borderRadius:8,background:"linear-gradient(135deg,#164e63,#0f172a)"}}/><div style={{marginTop:7,fontSize:12,fontWeight:900}}>{n}</div><div style={{color:"#67e8f9",fontWeight:950}}>{Math.max(65, selected.score-i*4)}</div></div>)}</div></div>
        </> : <p style={{color:"#cbd5e1"}}>No city matches the current filters. Loosen budget, search, or continent.</p>}</div>
      </aside>
    </section>
    <footer className={s.bottom}><Bottom label="Filters" value={activeFilters}/><Bottom label="Matched cities" value={`${visible.length} visible`}/><Bottom label="Top city" value={visible[0] ? `${visible[0].city.name} ${visible[0].score}` : "None"}/><Bottom label="Memory" value={`${memory?.savedTripCount ?? 0} trips · ${memory?.eventCount ?? 0} signals`}/><div className={s.bottomItem}><button className={s.scan} style={{margin:0}} onClick={()=>visible[0] && setSelectedId(visible[0].city.id)}>Select top match ↗</button></div></footer>
  </main>;
}

function Control({icon,title,children}:{icon:string;title:string;children:React.ReactNode}){return <div className={s.control}><div className={s.controlHead}><span className={s.icon}>{icon}</span>{title}</div>{children}</div>}
function Pill({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}){return <button type="button" onClick={onClick} className={`${s.pill} ${active?s.pillActive:""}`}>{children}</button>}
function Score({label,value}:{label:string;value:number}){return <div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:900,textTransform:"uppercase"}}><span>{label}</span><span>{value}</span></div><div className={s.bar}><div className={s.barFill} style={{width:`${Math.max(0, Math.min(100, value))}%`}}/></div></div>}
function Bottom({label,value}:{label:string;value:string}){return <div className={s.bottomItem}><div className={s.bottomLabel}>{label}</div><div className={s.bottomValue}>{value}</div></div>}
