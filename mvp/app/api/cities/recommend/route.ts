import { handleError, ok, parseJson } from "@/lib/server/api";
import { cityRecommendRequestSchema } from "@/lib/schemas/backend";
import { recommendCitiesService } from "@/lib/server/recommendation-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = cityRecommendRequestSchema.parse(body);
    return ok(recommendCitiesService(input));
  } catch (error) {
    return handleError(error);
  }
}
