import { handleError, ok, parseJson } from "@/lib/server/api";
import { businessProfileRequestSchema } from "@/lib/schemas/backend";
import { businessProfileService } from "@/lib/server/product-service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = businessProfileRequestSchema.parse(body);
    return ok(businessProfileService(input));
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  return ok({ profiles: [], persistence: "Database adapter ready; no active database connection configured." });
}
