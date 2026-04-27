"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { worldCities, continents, type Continent, type WorldCity } from "@/lib/world-data";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity } from "@/lib/scoring";
import { Real3DGlobe } from "@/components/real-3d-globe";
import s from "./world-command.module.css";

type TopN = 10 | 25 | 50 | 100;
type Ranked = { city: WorldCity; score: number; cost: number; globalRank: number; continentRank: number };
type SaveState = "idle" | "saving" | "saved" | "fallback" | "error";

function makeIntent() {
  const intent = defaultIntent();
  intent.desired_features.sea = true;
  intent.desired_features.historic = true;
  intent.desired_features.seafood = true;
  intent.desired_features.young_adults = true;
  intent.desired_features.international_crowd = true;
  intent.desired_features.bars = true;
  intent.travel_style = ["social", "culture", "food"];
  return intent;
}

export function WorldCommandCenter() {
  const [continent, setContinent] = useState<Continent | "All">("All");
  const [topN, setTopN] = useState<TopN>(25);
  const [selectedId, setSelectedId] = useState("istanbul-turkiye");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const intent = useMemo(makeIntent, []);

  const ranked = useMemo<Ranked[]>(() => {
    const base = worldCities.map((city) => {
      const result = scoreCity(city, intent);
      return { city, score: result.score, cost: result.estimatedCost };
    }).sort((a, b) => b.score - a.score);
    const counts = new Map<string, number>();
    return base.map((item, i) => {
      const n = (counts.get(item.city.continent) ?? 0) + 1;
      counts.set(item.city.continent, n);
      return { ...item, globalRank: i + 1, continentRank: n };
    });
  }, [intent]);

  const visible = ranked.filter((x) => continent === "All" || x.city.continent === continent).slice(0, topN);
  const selected = ranked.find((x) => x.city.id === selectedId) ?? ranked[0];
  const topCities = ranked.slice(0, 5);

  async function saveSelectedTrip() {
    if (!selected) return;
    setSaveState("saving");
    setSaveMessage("Saving selected city...");
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${selected.city.name}, ${selected.city.country}`,
          cityId: selected.city.id,
          month: "July",
          budgetLevel: selected.cost > 1200 ? "High" : selected.cost > 800 ? "Medium" : "Low",
          goal: "social-culture-food",
          computedScore: selected.score,
          notes: `Saved from /world. Global rank #${selected.globalRank}; continent rank #${selected.continentRank}. Estimated cost €${selected.cost}.`
        })
      });
      const json = await response.json();
      const status = json?.data?.status;
      setSaveState(status === "live" ? "saved" : "fallback");
      setSaveMessage(status === "live" ? "Trip saved to database." : json?.data?.message ?? "Trip captured in fallback mode; configure DATABASE_URL to persist.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Save failed.");
    }
  }

  return <main className={s.shell}>
    <div className={s.space}><div className={s.stars} /></div>
    <nav className={s.nav}>
      <Link href="/portal" className={s.brand}><span className={s.logo}/><span>SOCIAL TRAVEL<br/><span style={{fontWeight:600,letterSpacing:".08em"}}>INTELLIGENCE OS</span></span></Link>
      <div className={s.tabs}><span className={`${s.tab} ${s.tabActive}`}>World Intelligence</span><Link className={s.tab} href="/">Destinations</Link><Link className={s.tab} href="/lab">Comparisons</Link><Link className={s.tab} href="/trips">Saved Trips</Link><span className={s.tab}>Watchlist</span></div>
      <div className={s.rightNav}><input className={s.search} placeholder="Search cities, neighborhoods..."/><div className={s.bell}>◌</div><div className={s.avatar}>I</div></div>
    </nav>

    <section className={s.layout}>
      <aside className={`${s.panel} ${s.left}`}>
        <div className={s.panelTitle}><span className={s.icon}>⌖</span>Explore the world</div>
        <Control icon="🌐" title="Continent"><div className={s.selectLine}><span>{continent === "All" ? "All Continents" : continent}</span><span>⌄</span></div><div className={s.pills} style={{marginTop:10}}><Pill active={continent === "All"} onClick={() => setContinent("All")}>All</Pill>{continents.map(c => <Pill key={c} active={continent === c} onClick={() => setContinent(c)}>{c}</Pill>)}</div></Control>
        <Control icon="〽" title="Budget"><div className={s.rangeLabels}><span>$50</span><span>$500+</span></div><input className={s.range} type="range" defaultValue={42}/></Control>
        <Control icon="▣" title="Dates"><div className={s.selectLine}><span>Jun 15, 2025 → Jul 15, 2025</span><span>⌄</span></div></Control>
        <Control icon="▤" title="Stay length"><div className={s.rangeLabels}><span>7</span><span>30 nights</span></div><input className={s.range} type="range" defaultValue={62}/></Control>
        <Control icon="✈" title="Travel style"><div className={s.pills}>{["Any","Solo","Couple","Group","Digital Nomad"].map((x,i)=><span key={x} className={`${s.pill} ${i===0?s.pillActive:""}`}>{x}</span>)}</div></Control>
        <Control icon="☆" title="Desired features"><div className={s.pills}>{["Nightlife","Food Culture","Walkable","+2"].map((x,i)=><span key={x} className={`${s.pill} ${i<2?s.pillActive:""}`}>{x}</span>)}</div></Control>
        <Control icon="🛡" title="Avoidances"><div className={s.pills}>{["Extreme Weather","High Crime","+"].map(x=><span key={x} className={s.pill}>{x}</span>)}</div></Control>
        <Control icon="🏆" title="Ranking depth"><div className={s.pills}>{([10,25,50,100] as TopN[]).map(n=><Pill key={n} active={topN===n} onClick={()=>setTopN(n)}>Top {n}</Pill>)}</div></Control>
        <button className={s.scan}>Run world scan</button>
      </aside>

      <section className={s.stage}>
        <div className={`${s.floatStat} ${s.pulse}`}><div className={s.statLabel}>Global pulse<br/>Live city index</div><div style={{display:"flex",alignItems:"center",gap:12}}><div className={s.spark}/><div className={s.statValue}>73</div></div></div>
        <div className={`${s.floatStat} ${s.analyzed}`}><div className={s.statLabel}>Cities analyzed</div><div style={{fontSize:30,fontWeight:950}}>9,842</div><div style={{fontSize:11,color:"#86efac"}}>● Updated just now</div></div>
        <Real3DGlobe cities={visible} selectedId={selected.city.id} onSelect={setSelectedId}/>
        <div className={s.dock}><span className={s.dockBtn}>⌖</span><span className={`${s.dockBtn} ${s.dockActive}`}>◎</span><span className={s.dockBtn}>⌁</span><span className={s.dockBtn}>≋</span></div>
      </section>

      <aside className={`${s.panel} ${s.right}`}>
        <div className={s.panelTitle}><span className={s.icon}>◉</span>Selected city <span style={{marginLeft:"auto"}}>×</span></div>
        <div className={s.cityHero}/>
        <div className={s.rightBody}>
          <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start"}}><div><h2 style={{fontSize:24,fontWeight:950}}>{selected.city.name}, {selected.city.country}</h2><p style={{fontSize:12,color:"#93c5fd"}}>⌖ {selected.city.continent} • GMT+3</p></div><div className={s.scoreRing}>{selected.score}<span style={{fontSize:11,fontWeight:700}}>/100</span></div></div>
          <div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}><button className={s.scan} style={{margin:0}} onClick={saveSelectedTrip} disabled={saveState === "saving"}>{saveState === "saving" ? "Saving..." : "Save trip"}</button><Link className={s.pill} href="/trips">View trips</Link></div>
          {saveMessage ? <div style={{marginTop:10,border:"1px solid rgba(255,255,255,.12)",borderRadius:14,padding:"10px 12px",fontSize:12,color:saveState === "error" ? "#fca5a5" : saveState === "fallback" ? "#fde68a" : "#bbf7d0",background:"rgba(15,23,42,.55)"}}>{saveMessage}</div> : null}
          <div style={{marginTop:14,display:"grid",gap:10}}><Score label="Nightlife" value={selected.city.nightlife_score}/><Score label="Social Density" value={selected.city.social_density_score}/><Score label="History & Culture" value={selected.city.history_score}/><Score label="Food Culture" value={selected.city.food_culture_score}/><Score label="Mobility" value={selected.city.mobility_score}/></div>
          <div className={s.rankCards} style={{marginTop:16}}><div className={s.rankCard}><div className={s.statLabel}>Continent rank</div><div style={{fontSize:24,fontWeight:950}}>#{selected.continentRank}</div></div><div className={s.rankCard}><div className={s.statLabel}>Global rank</div><div style={{fontSize:24,fontWeight:950}}>#{selected.globalRank}</div></div></div>
          <div style={{marginTop:18}}><div className={s.controlHead} style={{justifyContent:"space-between"}}><span>Top cities</span><span style={{color:"#67e8f9"}}>View full ranking →</span></div>{topCities.map((x,i)=><button key={x.city.id} onClick={()=>setSelectedId(x.city.id)} className={`${s.topCity} ${x.city.id===selected.city.id?s.topCityActive:""}`}><span>{i+1}</span><span>{x.city.name}, {x.city.country}</span><b>{x.score}</b></button>)}</div>
          <div style={{marginTop:18}}><div className={s.controlHead}>Matching neighborhoods</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{selected.city.best_neighborhoods.slice(0,3).map((n,i)=><div key={n} className={s.rankCard} style={{padding:8}}><div style={{height:54,borderRadius:8,background:"linear-gradient(135deg,#164e63,#0f172a)"}}/><div style={{marginTop:7,fontSize:12,fontWeight:900}}>{n}</div><div style={{color:"#67e8f9",fontWeight:950}}>{92-i*4}</div></div>)}</div></div>
        </div>
      </aside>
    </section>

    <footer className={s.bottom}><Bottom label="Data sources" value="312+ Global Feeds"/><Bottom label="Social signals" value="24.8M Posts Analyzed"/><Bottom label="Trending rise" value="Tbilisi, Georgia +32%"/><Bottom label="New insight" value="Chiang Mai, Thailand"/><div className={s.bottomItem}><button className={s.scan} style={{margin:0}}>View insights feed ↗</button></div></footer>
  </main>;
}

function Control({icon,title,children}:{icon:string;title:string;children:React.ReactNode}){return <div className={s.control}><div className={s.controlHead}><span className={s.icon}>{icon}</span>{title}</div>{children}</div>}
function Pill({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}){return <button onClick={onClick} className={`${s.pill} ${active?s.pillActive:""}`}>{children}</button>}
function Score({label,value}:{label:string;value:number}){return <div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:900,textTransform:"uppercase"}}><span>{label}</span><span>{value}</span></div><div className={s.bar}><div className={s.barFill} style={{width:`${value}%`}}/></div></div>}
function Bottom({label,value}:{label:string;value:string}){return <div className={s.bottomItem}><div className={s.bottomLabel}>{label}</div><div className={s.bottomValue}>{value}</div></div>}
