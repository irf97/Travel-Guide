import { NextResponse } from "next/server";

export async function POST() {
  // Phase 1 simulated safe output.
  // Phase 3 TODO: accept authenticated uploads, store in Supabase Storage, call image model, validate output.
  return NextResponse.json({
    simulated: true,
    result: {
      place_type: ["cafe", "third_space"],
      ambience: ["warm", "social", "medium-energy"],
      group_friendliness: 0.82,
      laptop_friendliness: 0.64,
      sports_tv_visible: false,
      matcha_visible: true,
      baked_goods_visible: true,
      seafood_visible: false,
      terrace_visible: true,
      visual_cues: ["old-town street", "natural light", "group seating"],
      confidence: {
        ambience: 0.74,
        features: 0.68,
        terrace: 0.81
      },
      safety: [
        "No private individual identification",
        "No attractiveness ranking",
        "No sensitive trait inference",
        "Venue-level analysis only"
      ]
    }
  });
}
