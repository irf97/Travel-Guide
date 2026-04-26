import { NextResponse } from "next/server";
import { defaultIntent } from "@/lib/extraction";
import { scorePlace } from "@/lib/scoring";
import { intentSchema, tempPlaceSchema } from "@/lib/schemas";
import type { Place } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const parsedPlace = tempPlaceSchema.safeParse(body.place);
  const parsedIntent = intentSchema.safeParse(body.intent);

  if (!parsedPlace.success) {
    return NextResponse.json({ error: "Invalid temporary place", issues: parsedPlace.error.flatten() }, { status: 400 });
  }

  const intent = parsedIntent.success ? parsedIntent.data : defaultIntent();
  const place: Place = {
    id: `temp-${Date.now()}`,
    name: parsedPlace.data.name,
    type: parsedPlace.data.type,
    city_id: parsedPlace.data.city_id,
    neighborhood: parsedPlace.data.neighborhood,
    ambience_tags: parsedPlace.data.ambience_description ? [parsedPlace.data.ambience_description] : ["user-estimated"],
    feature_tags: parsedPlace.data.feature_tags as any,
    price_level: parsedPlace.data.price_level as any,
    social_ambience_score: parsedPlace.data.social_score,
    evidence_confidence_score: parsedPlace.data.evidence_score,
    business_confirmed: parsedPlace.data.business_confirmed,
    good_for: ["groups", "meeting people"],
    notes: parsedPlace.data.notes ?? "Temporary user-estimated place."
  };

  return NextResponse.json({ place, result: scorePlace(place, intent, 70) });
}
