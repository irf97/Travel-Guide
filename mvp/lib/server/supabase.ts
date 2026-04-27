import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseStatus = {
  configured: boolean;
  storageConfigured: boolean;
  reason?: string;
};

export function getSupabaseStatus(): SupabaseStatus {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!hasUrl || !hasService) {
    return { configured: false, storageConfigured: false, reason: "Supabase URL or service role key is missing" };
  }
  return { configured: true, storageConfigured: true };
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function uploadImageToStorage(input: { bucket?: string; path: string; file: Blob; contentType?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, configured: false, url: null as string | null, path: input.path, error: "Supabase storage is not configured" };
  }
  const bucket = input.bucket ?? process.env.SUPABASE_STORAGE_BUCKET ?? "place-images";
  const { error } = await supabase.storage.from(bucket).upload(input.path, input.file, {
    contentType: input.contentType,
    upsert: true
  });
  if (error) return { ok: false, configured: true, url: null, path: input.path, error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(input.path);
  return { ok: true, configured: true, url: data.publicUrl, path: input.path, error: null };
}
