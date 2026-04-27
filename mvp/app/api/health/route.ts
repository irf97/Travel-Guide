import { ok } from "@/lib/server/api";
import { getDbStatus } from "@/lib/server/db";
import { getSupabaseStatus } from "@/lib/server/supabase";
import { getAiAdapterStatus } from "@/lib/server/openai-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDbStatus();
  const supabase = getSupabaseStatus();
  const ai = getAiAdapterStatus();

  return ok({
    status: "ok",
    service: "social-travel-intelligence-os",
    generatedAt: new Date().toISOString(),
    adapters: {
      database: db,
      supabase,
      ai
    },
    mode: {
      database: db.configured ? "live" : "fallback",
      storage: supabase.storageConfigured ? "live" : "fallback",
      ai: ai.configured ? "gated-live-ready" : "local-fallback"
    }
  });
}
