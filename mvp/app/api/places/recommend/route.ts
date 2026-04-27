import { handleError, ok, parseJson } from "@/lib/server/api";
import { placeRecommendRequestSchema } from "@/lib/schemas/backend";
import { recommendPlacesService } from "@/lib/server/recommendation-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = placeRecommendRequestSchema.parse(body);
    return ok(recommendPlacesService(input));
  } catch (error) {
    return handleError(error);
  }
}
