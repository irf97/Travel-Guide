import { NextResponse } from "next/server";
import { cities } from "@/lib/seed";
import { defaultIntent } from "@/lib/extraction";
import { scoreCity } from "@/lib/scoring";
import { intentSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const intent = intentSchema.safeParse(body.intent).success ? intentSchema.parse(body.intent) : defaultIntent();

  const recommendations = cities
    .map((city) => ({ city, result: scoreCity(city, intent) }))
    .sort((a, b) => b.result.score - a.result.score);

  return NextResponse.json({ recommendations, scoring: "transparent-v1" });
}
