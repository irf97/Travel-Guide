import { handleError, ok, parseJson } from "@/lib/server/api";
import { feedbackRequestSchema } from "@/lib/schemas/backend";
import { feedbackService } from "@/lib/server/product-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = feedbackRequestSchema.parse(body);
    return ok(feedbackService(input));
  } catch (error) {
    return handleError(error);
  }
}
