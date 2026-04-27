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

type TripInput = z.infer<typeof tripSchema>;

type TripView = {
  id: string;
  title: string;
  cityId?: string;
  month?: string;
  budgetLevel?: string;
  goal?: string;
  computedScore?: number;
  notes?: string;
  createdAt: string;
};

type TripsGetResponse = {
  status: "live" | "fallback";
  trips: TripView[];
  message: string;
};

type TripWriteResponse = {
  status: "live" | "fallback";
  persisted: boolean;
  trip: TripView;
  message: string;
};

function fallbackTrip(input: TripInput): TripView {
  return { id: `fallback_${Date.now()}`, ...input, createdAt: new Date().toISOString() };
}

function tripFromInput(id: string, input: TripInput, createdAt: Date | string = new Date()): TripView {
  return {
    id,
    title: input.title,
    cityId: input.cityId,
    month: input.month,
    budgetLevel: input.budgetLevel,
    goal: input.goal,
    computedScore: input.computedScore,
    notes: input.notes,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt
  };
}

export async function GET() {
  try {
    return ok(await withDb<TripsGetResponse>(
      async (db) => {
        const trips = await db.trip.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
        return {
          status: "live",
          trips: trips.map((trip) => ({
            id: trip.id,
            title: trip.title,
            createdAt: trip.createdAt instanceof Date ? trip.createdAt.toISOString() : String(trip.createdAt)
          })),
          message: "Trips loaded from database."
        };
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
    return ok(await withDb<TripWriteResponse>(
      async (db) => {
        const created = await db.trip.create({
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
        return { status: "live", persisted: true, trip: tripFromInput(created.id, input, created.createdAt), message: "Trip saved to database." };
      },
      () => ({ status: "fallback", persisted: false, trip: fallbackTrip(input), message: "DATABASE_URL is not configured; this trip was not persisted." })
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
        return { status: "live", deleted: true, id, message: "Trip deleted from database." };
      },
      () => ({ status: "fallback", deleted: false, id, message: "DATABASE_URL is not configured; no persisted trip was deleted." })
    ));
  } catch (error) {
    return handleError(error);
  }
}
