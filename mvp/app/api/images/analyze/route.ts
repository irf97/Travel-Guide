import { handleError, ok, parseJson } from "@/lib/server/api";
import { imageAnalyzeRequestSchema } from "@/lib/schemas/backend";
import { imageAnalyzeService } from "@/lib/server/product-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = imageAnalyzeRequestSchema.parse(body);
    return ok(imageAnalyzeService(input));
  } catch (error) {
    return handleError(error);
  }
}
