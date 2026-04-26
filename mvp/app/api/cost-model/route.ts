import { NextResponse } from "next/server";
import { z } from "zod";

const costSchema = z.object({
  monthly_active_users: z.number().int().min(0).default(1000),
  voice_notes_per_user: z.number().min(0).default(5),
  image_analyses_per_month: z.number().int().min(0).default(2000),
  llm_recommendations_per_user: z.number().min(0).default(10),
  places_in_database: z.number().int().min(0).default(10000),
  businesses_claimed: z.number().int().min(0).default(300),
  storage_mb_per_image: z.number().min(0).default(2),
  api_cost_multiplier: z.number().min(0).default(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const input = costSchema.parse(body);
  const m = input.api_cost_multiplier;

  const hosting = 30;
  const database_storage = 20 + input.places_in_database * 0.001 + input.image_analyses_per_month * input.storage_mb_per_image * 0.0004;
  const voice_transcription = input.monthly_active_users * input.voice_notes_per_user * 0.006 * m;
  const image_analysis = input.image_analyses_per_month * 0.035 * m;
  const llm_reasoning = input.monthly_active_users * input.llm_recommendations_per_user * 0.01 * m;
  const maps_place_api = (input.monthly_active_users * 0.04 + input.businesses_claimed * 0.08) * m;
  const total = hosting + database_storage + voice_transcription + image_analysis + llm_reasoning + maps_place_api;

  return NextResponse.json({
    input,
    breakdown: {
      hosting,
      database_storage,
      voice_transcription,
      image_analysis,
      llm_reasoning,
      maps_place_api,
      total
    },
    rule: "Analyze once → store structured tags → reuse forever."
  });
}
