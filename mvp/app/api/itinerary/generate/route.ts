import { handleError, ok, parseJson } from "@/lib/server/api";
import { itineraryGenerateRequestSchema } from "@/lib/schemas/backend";
import { generateItineraryService } from "@/lib/server/recommendation-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = itineraryGenerateRequestSchema.parse(body);
    return ok(generateItineraryService(input));
  } catch (error) {
    return handleError(error);
  }
}
