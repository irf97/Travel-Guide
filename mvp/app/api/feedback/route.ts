import { NextResponse } from "next/server";
import { z } from "zod";

const feedbackSchema = z.object({
  target_type: z.enum(["city", "place", "event", "route"]),
  target_id: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  notes: z.string().max(2000).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback", issues: parsed.error.flatten() }, { status: 400 });
  }

  // Phase 2 TODO: persist user feedback for calibration.
  return NextResponse.json({ status: "accepted-not-persisted", feedback: parsed.data });
}
