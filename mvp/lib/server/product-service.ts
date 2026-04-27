import { nowIso } from "./api";
import { analyzeImageSafely } from "./openai-adapter";

export function businessProfileService(input: Record<string, any>) {
  const profile = {
    id: input.id ?? `business_${Date.now()}`,
    ...input,
    generatedStructuredProfile: {
      place_type: [input.type ?? "venue"],
      ambience: input.ambience ?? {},
      features: input.features ?? {},
      best_times: input.bestTimes ?? {},
      use_cases: {
        groups: Boolean(input.features?.groups ?? input.features?.group_friendly),
        remote_work: Boolean(input.features?.coworking_tables ?? input.ambience?.laptop_friendly),
        meeting_people: Boolean(input.ambience?.social && input.ambience.social > 0.65),
        watching_sports: Boolean(input.features?.sports_tv)
      },
      evidence: {
        business_confirmed: true,
        media_consent_confirmed: Boolean(input.mediaConsentConfirmed),
        last_verified: nowIso()
      }
    }
  };
  return { profile, persisted: false, persistence: "Supabase/Prisma adapter ready; no database keys active in this deploy.", generatedAt: nowIso() };
}

export async function imageAnalyzeService(input: { imageUrls: string[]; filenameHints: string[]; consentConfirmed: boolean; useAi?: boolean }) {
  const filenames = input.filenameHints.join(" ").toLowerCase();
  const adapter = await analyzeImageSafely({ imageUrls: input.imageUrls, useAi: input.useAi });
  const tags = {
    place_type: filenames.includes("cafe") ? ["cafe", "third_space"] : filenames.includes("bar") ? ["bar"] : ["venue"],
    ambience: [filenames.includes("night") ? "night-energy" : "daytime", filenames.includes("terrace") ? "terrace" : "indoor-unknown"],
    group_friendliness: filenames.includes("group") ? 0.84 : 0.66,
    laptop_friendliness: filenames.includes("laptop") || filenames.includes("cowork") ? 0.82 : 0.42,
    sports_tv_visible: filenames.includes("sports") || filenames.includes("football"),
    matcha_visible: filenames.includes("matcha"),
    baked_goods_visible: filenames.includes("bake") || filenames.includes("pastry"),
    seafood_visible: filenames.includes("seafood") || filenames.includes("fish"),
    terrace_visible: filenames.includes("terrace") || filenames.includes("rooftop"),
    old_town_visual_cue: filenames.includes("old") || filenames.includes("historic"),
    confidence: {
      venue_level_only: 0.9,
      no_identity_analysis: 1,
      consent_confirmed: input.consentConfirmed ? 1 : 0,
      adapter_confidence: adapter.confidence
    }
  };
  return {
    tags,
    adapter,
    safety: ["No private individual identification", "No attractiveness ranking", "No sensitive trait inference", "Venue-level tags only"],
    source: adapter.provider,
    generatedAt: nowIso()
  };
}

export function feedbackService(input: Record<string, any>) {
  return { feedback: { id: `feedback_${Date.now()}`, ...input, createdAt: nowIso() }, persisted: false, calibrationImpact: { recommendation_weight_delta: input.matchedExpectation ? 0.02 : -0.03, targetId: input.targetId, targetType: input.targetType } };
}

export function costModelService(input: Record<string, number>) {
  const mau = input.monthlyActiveUsers ?? 1000;
  const voice = mau * (input.voiceNotesPerUser ?? 2) * 0.006;
  const llm = mau * (input.llmRecommendationsPerUser ?? 4) * 0.012;
  const image = (input.imageAnalysesPerMonth ?? 1000) * 0.015;
  const storage = ((input.imageAnalysesPerMonth ?? 1000) * (input.storagePerImageMb ?? 1.5) / 1024) * 0.03 + (input.placesInDatabase ?? 5000) * 0.0006;
  const maps = mau * 0.018;
  const hosting = Math.max(20, mau * 0.015);
  const multiplier = input.apiCostMultiplier ?? 1;
  const breakdown = {
    hosting: Math.round(hosting * multiplier),
    database_storage: Math.round(storage * multiplier),
    voice_transcription: Math.round(voice * multiplier),
    image_analysis: Math.round(image * multiplier),
    llm_reasoning: Math.round(llm * multiplier),
    maps_place_api: Math.round(maps * multiplier)
  };
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const largestCostDriver = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
  return { breakdown, totalMonthlyEstimateEur: total, largestCostDriver, costControlRule: "Analyze once → store structured tags → reuse forever.", generatedAt: nowIso() };
}
