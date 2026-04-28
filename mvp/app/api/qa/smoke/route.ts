import { runSmokeChecks } from "@/lib/qa-smoke";
import { ok } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    status: "qa-smoke",
    ...runSmokeChecks()
  });
}
