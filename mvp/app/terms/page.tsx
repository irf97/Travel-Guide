import { Card } from "@/components/ui";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Card>
        <h1 className="text-4xl font-black text-white">Terms Placeholder</h1>
        <p className="mt-4 text-slate-300">
          This page is a production placeholder. Before launch, replace it with terms that cover traveler use, business claims, media upload rights, prohibited uses, safety boundaries, and platform limitations.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-slate-300">
          <li>This is not a dating app.</li>
          <li>The platform recommends places, environments, and opt-in events, not individual people.</li>
          <li>No scraping personal profiles or targeting people by gender or protected traits.</li>
          <li>Businesses must only upload media they own or have consent to use.</li>
          <li>Recommendations are decision support, not guarantees.</li>
        </ul>
      </Card>
    </main>
  );
}
