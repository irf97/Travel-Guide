import { NextResponse } from "next/server";
import { extractIntentLocally } from "@/lib/extraction";
import { intakeRequestSchema, intentSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = intakeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid intake input", issues: parsed.error.flatten() }, { status: 400 });
  }

  // Phase 1 fallback: deterministic local extraction.
  // Phase 3 TODO: call OpenAI with strict JSON schema, then validate with intentSchema.
  const intent = extractIntentLocally({
    text: parsed.data.text,
    groupSize: parsed.data.group_size,
    ageRange: parsed.data.age_range,
    budget: parsed.data.budget_per_person,
    nights: parsed.data.nights,
    month: parsed.data.month ?? "July",
    style: (parsed.data.travel_style?.[0] as any) ?? "balanced"
  });

  const validated = intentSchema.parse(intent);
  return NextResponse.json({ intent: validated, source: "local-fallback" });
}
