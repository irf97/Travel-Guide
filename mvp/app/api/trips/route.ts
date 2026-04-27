import { handleError, ok, parseJson } from "@/lib/server/api";
import { withDb } from "@/lib/server/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const tripSchema = z.object({
  title: z.string().min(1).default("Saved world trip"),
  cityId: z.string().min(1).optional(),
  month: z.string().optional(),
  budgetLevel: z.string().optional(),
  goal: z.string().optional(),
  computedScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional()
});

export async function GET() {
  try {
    return ok(await withDb(
      async (db) => {
        const trips = await db.trip.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
        return { status: "live", trips };
      },
      () => ({ status: "fallback", trips: [], message: "DATABASE_URL is not configured; saved trips are not persisted yet." })
    ));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, {});
    const input = tripSchema.parse(body);
    return ok(await withDb(
      async (db) => {
        const trip = await db.trip.create({
          data: {
            title: input.title,
            cityId: input.cityId,
            month: input.month,
            budgetLevel: input.budgetLevel,
            goal: input.goal,
            computedScore: input.computedScore,
            notes: input.notes
          }
        });
        return { status: "live", trip, persisted: true };
      },
      () => ({ status: "fallback", persisted: false, trip: { id: `fallback_${Date.now()}`, ...input, createdAt: new Date().toISOString() }, message: "DATABASE_URL is not configured; this trip was not persisted." })
    ));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return ok({ status: "fallback", deleted: false, message: "Missing id." }, { status: 400 });
    return ok(await withDb(
      async (db) => {
        await db.trip.delete({ where: { id } });
        return { status: "live", deleted: true, id };
      },
      () => ({ status: "fallback", deleted: false, id, message: "DATABASE_URL is not configured; no persisted trip was deleted." })
    ));
  } catch (error) {
    return handleError(error);
  }
}
