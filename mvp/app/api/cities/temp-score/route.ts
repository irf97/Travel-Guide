import { handleError, ok, parseJson } from "@/lib/server/api";
import { tempCityScoreRequestSchema } from "@/lib/schemas/backend";
import { scoreTemporaryCityService } from "@/lib/server/recommendation-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = tempCityScoreRequestSchema.parse(body);
    return ok(scoreTemporaryCityService(input));
  } catch (error) {
    return handleError(error);
  }
}
