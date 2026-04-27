import { handleError, ok, parseJson } from "@/lib/server/api";
import { worldRecommendRequestSchema } from "@/lib/schemas/backend";
import { recommendWorldService } from "@/lib/server/recommendation-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = worldRecommendRequestSchema.parse(body);
    return ok(recommendWorldService(input));
  } catch (error) {
    return handleError(error);
  }
}
