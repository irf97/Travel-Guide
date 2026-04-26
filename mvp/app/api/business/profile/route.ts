import { NextResponse } from "next/server";
import { z } from "zod";

const businessProfileSchema = z.object({
  identity: z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    type: z.string().min(1),
    opening_hours: z.string().optional(),
    website: z.string().optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    reservation_link: z.string().optional(),
    price_range: z.string().optional(),
    languages_spoken: z.array(z.string()).default([])
  }),
  ambience: z.record(z.union([z.boolean(), z.number(), z.string()])).default({}),
  features: z.record(z.boolean()).default({}),
  best_times: z.record(z.boolean()).default({}),
  media_consent: z.boolean()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = businessProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid business profile", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.media_consent) {
    return NextResponse.json({ error: "Business media consent is required before production upload." }, { status: 400 });
  }

  const profile = {
    place_type: [parsed.data.identity.type],
    ambience: parsed.data.ambience,
    features: parsed.data.features,
    crowd_fit: {
      young_adults: parsed.data.ambience.young_adults ? 0.8 : 0.4,
      families: parsed.data.ambience.families ? 0.7 : 0.3,
      tourists: parsed.data.ambience.tourist ? 0.7 : 0.4,
      locals: parsed.data.ambience.local ? 0.7 : 0.4
    },
    use_cases: {
      groups: Boolean(parsed.data.ambience.good_for_groups),
      solo_travelers: Boolean(parsed.data.ambience.good_for_solo_travelers),
      remote_work: Boolean(parsed.data.ambience.good_for_remote_work),
      meeting_people: Boolean(parsed.data.ambience.good_for_meeting_people)
    },
    evidence: {
      business_confirmed: true,
      image_count: 0,
      last_verified: new Date().toISOString(),
      media_consent: true
    }
  };

  // Phase 2 TODO: require Supabase Auth, persist BusinessProfile, upload images to Supabase Storage.
  return NextResponse.json({ profile, status: "generated-not-persisted" });
}
