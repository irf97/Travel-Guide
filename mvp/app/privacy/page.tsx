import { Card } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Card>
        <h1 className="text-4xl font-black text-white">Privacy Policy Placeholder</h1>
        <p className="mt-4 text-slate-300">
          This MVP page is a placeholder. Before production launch, replace it with a reviewed privacy policy covering account data, trip preferences, voice notes, business media, storage, retention, deletion requests, and subprocessors.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-slate-300">
          <li>No real user data should be collected in the static demo.</li>
          <li>Production must support data access, correction, export, and deletion requests.</li>
          <li>Business images require ownership or consent.</li>
          <li>Faces should be blurred before public display where applicable.</li>
          <li>The product does not identify private individuals or infer sensitive traits.</li>
        </ul>
      </Card>
    </main>
  );
}
