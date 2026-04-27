import { handleError, ok, parseJson } from "@/lib/server/api";
import { intakeExtractRequestSchema } from "@/lib/schemas/backend";
import { extractIntentService } from "@/lib/server/recommendation-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = intakeExtractRequestSchema.parse(body);
    return ok(await extractIntentService(input));
  } catch (error) {
    return handleError(error);
  }
}
