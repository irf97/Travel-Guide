import { handleError, ok, parseJson } from "@/lib/server/api";
import { tempPlaceScoreRequestSchema } from "@/lib/schemas/backend";
import { scoreTemporaryPlaceService } from "@/lib/server/recommendation-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = tempPlaceScoreRequestSchema.parse(body);
    return ok(scoreTemporaryPlaceService(input));
  } catch (error) {
    return handleError(error);
  }
}
