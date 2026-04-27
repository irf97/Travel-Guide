import { BusinessPortalPanel, DecisionBoardPanel, ImageDefinerPanel, NetworkingPanel, OpportunityRadarPanel, RouteGeneratorPanel } from "@/components/advanced-panels";
import { Card, Chip, GhostButton } from "@/components/ui";
import { cities, places } from "@/lib/seed";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity, scorePlace } from "@/lib/scoring";
import Link from "next/link";

export default function ProductLabPage() {
  const intent = defaultIntent();
  intent.desired_features.sea = true;
  intent.desired_features.historic = true;
  intent.desired_features.seafood = true;
  intent.desired_features.international_crowd = true;
  intent.desired_features.bars = true;
  intent.desired_features.young_adults = true;
  intent.avoid.too_crowded = true;
  intent.travel_style = ["social", "culture", "food"];

  const rankedCities = cities
    .map((city) => ({ city, result: scoreCity(city, intent) }))
    .sort((a, b) => b.result.score - a.result.score);

  const cityScores = new Map(rankedCities.map(({ city, result }) => [city.id, result.score]));
  const rankedPlaces = places
    .map((place) => ({ place, result: scorePlace(place, intent, cityScores.get(place.city_id) ?? 70) }))
    .sort((a, b) => b.result.score - a.result.score);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-16">
      <section className="grid gap-6 py-12 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <Chip tone="good">advanced product lab</Chip>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] text-white md:text-7xl">
            The operating-system layer.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            This route contains the experimental founder-level functionality: group decision tuning, opportunity radar, route composition, business ambience confirmation, image-based place definition, and opt-in networking.
          </p>
          <Link href="/">
            <GhostButton className="mt-6">Back to main app</GhostButton>
          </Link>
        </div>
        <Card>
          <h2 className="text-2xl font-black text-white">What changed</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
            <p>1. Group decision cockpit turns disagreement into weighted tradeoffs.</p>
            <p>2. Opportunity radar explains where the trip is most likely to work.</p>
            <p>3. Social route generator composes places into energy-aware days.</p>
            <p>4. Business portal generates structured ambience profiles.</p>
            <p>5. Image definer simulates safe venue-level evidence extraction.</p>
          </div>
        </Card>
      </section>

      <OpportunityRadarPanel rankedCities={rankedCities} rankedPlaces={rankedPlaces} />
      <DecisionBoardPanel rankedCities={rankedCities} />
      <RouteGeneratorPanel rankedCities={rankedCities} rankedPlaces={rankedPlaces} />
      <BusinessPortalPanel />
      <ImageDefinerPanel />
      <NetworkingPanel />
    </main>
  );
}
