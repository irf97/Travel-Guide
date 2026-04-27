import { getAiAdapterStatus } from "./openai-adapter";
import { getDbStatus } from "./db";
import { getSupabaseStatus } from "./supabase";

export type ProviderHealth = {
  key: string;
  label: string;
  category: "infra" | "open-bulk" | "open-live" | "commercial" | "ai";
  configured: boolean;
  requiredForPersonalUse: boolean;
  status: "live" | "available" | "not_configured" | "fallback";
  envVars: string[];
  notes: string;
};

function hasEvery(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]));
}

function provider(input: Omit<ProviderHealth, "configured" | "status"> & { envVars?: string[]; noKey?: boolean }): ProviderHealth {
  const envVars = input.envVars ?? [];
  const configured = input.noKey ? true : hasEvery(envVars);
  return {
    key: input.key,
    label: input.label,
    category: input.category,
    requiredForPersonalUse: input.requiredForPersonalUse,
    envVars,
    notes: input.notes,
    configured,
    status: configured ? "available" : input.requiredForPersonalUse ? "fallback" : "not_configured"
  };
}

export function getProviderHealth(): ProviderHealth[] {
  const db = getDbStatus();
  const supabase = getSupabaseStatus();
  const ai = getAiAdapterStatus();

  return [
    { key: "database", label: "Postgres / Prisma", category: "infra", configured: db.configured, requiredForPersonalUse: true, status: db.configured ? "live" : "fallback", envVars: ["DATABASE_URL"], notes: db.reason ?? "Database adapter is live." },
    { key: "supabase", label: "Supabase Storage/Auth", category: "infra", configured: supabase.configured, requiredForPersonalUse: false, status: supabase.configured ? "live" : "fallback", envVars: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"], notes: supabase.reason ?? "Supabase adapter is live." },
    provider({ key: "s3", label: "S3-compatible object storage", category: "infra", requiredForPersonalUse: false, envVars: ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY"], notes: "Needed for local Parquet/artifact storage outside Supabase." }),
    { key: "openai", label: "OpenAI gated adapter", category: "ai", configured: ai.configured, requiredForPersonalUse: false, status: ai.configured ? "available" : "fallback", envVars: ["OPENAI_API_KEY"], notes: ai.reason ?? "AI adapter is configured; paid calls remain gated." },
    provider({ key: "open-meteo", label: "Open-Meteo", category: "open-live", requiredForPersonalUse: true, noKey: true, envVars: ["OPEN_METEO_BASE"], notes: "No key required. Used for weather comfort and outdoor/social risk." }),
    provider({ key: "overpass", label: "OSM Overpass", category: "open-live", requiredForPersonalUse: false, noKey: true, envVars: ["OVERPASS_URL"], notes: "No key, rate-limited. Cache aggressively and self-host later." }),
    provider({ key: "nominatim", label: "Nominatim", category: "open-live", requiredForPersonalUse: false, noKey: true, envVars: ["NOMINATIM_URL"], notes: "No key, strict public usage policy. Use for tiny/admin geocoding only." }),
    provider({ key: "overture", label: "Overture Maps bulk", category: "open-bulk", requiredForPersonalUse: false, noKey: true, envVars: ["OVERTURE_RELEASE", "OVERTURE_S3_BUCKET"], notes: "Monthly bulk ingestion; do not run inside Vercel functions." }),
    provider({ key: "fsq-os", label: "FSQ OS Places", category: "open-bulk", requiredForPersonalUse: false, envVars: ["HF_TOKEN", "FSQ_OS_PLACES_DATASET"], notes: "Newer releases require HuggingFace token. Used to fill Overture gaps." }),
    provider({ key: "gdelt", label: "GDELT", category: "open-bulk", requiredForPersonalUse: true, noKey: true, envVars: ["GDELT_DOC_API_BASE", "GDELT_EVENTS_BASE"], notes: "No key. Used for news/event momentum and demand pressure." }),
    provider({ key: "eurostat", label: "Eurostat", category: "open-bulk", requiredForPersonalUse: false, noKey: true, envVars: ["EUROSTAT_API_BASE"], notes: "Official EU tourism/statistics baseline." }),
    provider({ key: "worldbank", label: "World Bank", category: "open-bulk", requiredForPersonalUse: false, noKey: true, envVars: ["WORLDBANK_API_BASE"], notes: "Macro/demographic baseline." }),
    provider({ key: "amadeus", label: "Amadeus Flights", category: "commercial", requiredForPersonalUse: false, envVars: ["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"], notes: "Commercial gap-filler for actual flight pricing." }),
    provider({ key: "liteapi", label: "LiteAPI Hotels", category: "commercial", requiredForPersonalUse: false, envVars: ["LITEAPI_KEY"], notes: "Commercial gap-filler for hotel rates." })
  ];
}
