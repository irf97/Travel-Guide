import { ok } from "@/lib/server/api";
import { getDbStatus } from "@/lib/server/db";
import { getSupabaseStatus } from "@/lib/server/supabase";
import { getAiAdapterStatus } from "@/lib/server/openai-adapter";
import { getProviderHealth } from "@/lib/server/provider-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDbStatus();
  const supabase = getSupabaseStatus();
  const ai = getAiAdapterStatus();
  const providers = getProviderHealth();

  return ok({
    status: "ok",
    service: "social-travel-intelligence-os",
    generatedAt: new Date().toISOString(),
    adapters: {
      database: db,
      supabase,
      ai
    },
    providers,
    summary: {
      totalProviders: providers.length,
      configured: providers.filter((provider) => provider.configured).length,
      fallback: providers.filter((provider) => provider.status === "fallback").length,
      notConfigured: providers.filter((provider) => provider.status === "not_configured").length
    },
    mode: {
      database: db.configured ? "live" : "fallback",
      storage: supabase.storageConfigured ? "live" : "fallback",
      ai: ai.configured ? "gated-live-ready" : "local-fallback"
    }
  });
}
