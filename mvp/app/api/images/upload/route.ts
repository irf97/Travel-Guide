import { handleError, ok } from "@/lib/server/api";
import { uploadImageToStorage } from "@/lib/server/supabase";
import { analyzeImageSafely } from "@/lib/server/openai-adapter";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const placeId = String(form.get("placeId") ?? "unassigned");
    const consentConfirmed = String(form.get("consentConfirmed") ?? "false") === "true";
    const useAi = String(form.get("useAi") ?? "false") === "true";

    if (!(file instanceof Blob)) {
      return ok({ uploaded: false, configured: false, error: "No image file was provided." }, { status: 400 });
    }

    if (!consentConfirmed) {
      return ok({ uploaded: false, configured: false, error: "Image upload requires media consent confirmation." }, { status: 400 });
    }

    const safeName = `place-${placeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const uploaded = await uploadImageToStorage({ path: safeName, file, contentType: file.type || "image/jpeg" });
    const analysis = await analyzeImageSafely({ imageUrls: uploaded.url ? [uploaded.url] : [], useAi });

    return ok({ uploaded: uploaded.ok, storage: uploaded, analysis });
  } catch (error) {
    return handleError(error);
  }
}
