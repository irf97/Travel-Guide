import Link from "next/link";
import { Card, Chip, GhostButton, SectionHeader, SoftCard } from "@/components/ui";

const links = [
  { href: "/", title: "Main Product App", body: "Traveler intake, destination intelligence, place matching, cost model, safety, and architecture." },
  { href: "/world", title: "World Intelligence", body: "Immersive Earth interface with continent rankings, Top 10/25/50/100, filters, and city drilldowns." },
  { href: "/lab", title: "Advanced Product Lab", body: "Decision cockpit, opportunity radar, social route generator, image definer, and business ambience builder." },
  { href: "/privacy", title: "Privacy Placeholder", body: "Production privacy requirements and data handling principles." },
  { href: "/terms", title: "Terms Placeholder", body: "Platform rules, business media consent, and prohibited use boundaries." }
];

export default function PortalPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Chip tone="good">single link hub</Chip>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] text-white md:text-7xl">
            Social Travel Intelligence OS portal.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            One entry point connecting the user-facing MVP, the world intelligence surface, the advanced product lab, and compliance placeholders.
          </p>
          <Link href="/world"><GhostButton className="mt-6">Open World Intelligence</GhostButton></Link>
        </div>
        <Card>
          <SectionHeader eyebrow="System map" title="Connected routes" body="Use this as the one shareable navigation layer while the product expands." />
          <div className="grid gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <SoftCard className="transition hover:border-cyan-200/40">
                  <h2 className="text-xl font-black text-white">{link.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{link.body}</p>
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">{link.href}</p>
                </SoftCard>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
