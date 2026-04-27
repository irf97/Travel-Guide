import Link from "next/link";
import { Card, Chip, GhostButton, MetricBar, SectionHeader, SoftCard, StatPill } from "@/components/ui";

const modules = [
  { title: "Decision cockpit", score: 86, body: "Turns group disagreement into visible weighted tradeoffs across budget, nightlife, culture, food, mobility, and social density." },
  { title: "Opportunity radar", score: 82, body: "Compresses city ranking, place evidence, social density, and business confirmation into a founder-readable trip thesis." },
  { title: "Social route generator", score: 78, body: "Composes matched places into energy-aware day blocks: morning, afternoon, evening, night, and recovery windows." },
  { title: "Business ambience builder", score: 74, body: "Lets venues describe their actual social reality instead of vague listing copy like cozy or good atmosphere." },
  { title: "Image-based place definer", score: 70, body: "Conceptually turns venue images into safe place-level tags without identifying private individuals or sensitive traits." },
  { title: "Networking contexts", score: 84, body: "Recommends opt-in environments like language exchanges, sports nights, food tours, and coworking socials — never individual people." }
];

export default function ProductLabPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-16">
      <section className="grid gap-6 py-12 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <Chip tone="good">advanced product lab</Chip>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] text-white md:text-7xl">
            The operating-system layer.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A stable overview of the next functional modules: group decision tuning, opportunity radar, route composition, venue ambience confirmation, image definition, and opt-in networking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/portal"><GhostButton>Back to portal</GhostButton></Link>
            <Link href="/world"><GhostButton>Open world intelligence</GhostButton></Link>
          </div>
        </div>
        <Card>
          <SectionHeader eyebrow="Lab status" title="Prototype modules" body="These modules are staged as product concepts while /world becomes the primary interactive surface." />
          <div className="grid gap-3 md:grid-cols-2">
            <StatPill label="Modules" value={modules.length} note="concept blocks" />
            <StatPill label="Main surface" value="/world" note="immersive globe" />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <SoftCard key={module.title}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-black text-white">{module.title}</h2>
              <Chip tone="good">{module.score}</Chip>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{module.body}</p>
            <div className="mt-5"><MetricBar label="Implementation readiness" score={module.score} /></div>
          </SoftCard>
        ))}
      </section>
    </main>
  );
}
