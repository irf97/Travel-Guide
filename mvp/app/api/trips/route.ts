import { handleError, ok, parseJson } from "@/lib/server/api";
import { withDb } from "@/lib/server/db";
import { getExistingVisitorKey, getOrCreateAnonymousVisitor, visitorCookieOptions } from "@/lib/server/visitor-memory";
import { cookies } from "next/headers";
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
  visitorScoped: boolean;
  memorySource: "cookie" | "new-cookie" | "fallback-headers";
  trips: TripView[];
  message: string;
};

type TripWriteResponse = {
  status: "live" | "fallback";
  visitorScoped: boolean;
  memorySource: "cookie" | "new-cookie" | "fallback-headers";
  persisted: boolean;
  trip: TripView;
  message: string;
};

function fallbackTrip(input: TripInput): TripView {
  return { id: `fallback_${Date.now()}`, ...input, createdAt: new Date().toISOString() };
}

function tripViewFromDb(trip: { id: string; title: string; cityId: string | null; month: string | null; budgetLevel: string | null; goal: string | null; computedScore: number | null; notes: string | null; createdAt: Date | string }): TripView {
  return {
    id: trip.id,
    title: trip.title,
    cityId: trip.cityId ?? undefined,
    month: trip.month ?? undefined,
    budgetLevel: trip.budgetLevel ?? undefined,
    goal: trip.goal ?? undefined,
    computedScore: trip.computedScore ?? undefined,
    notes: trip.notes ?? undefined,
    createdAt: trip.createdAt instanceof Date ? trip.createdAt.toISOString() : String(trip.createdAt)
  };
}

export async function GET(request: Request) {
  try {
    const visitorKey = getExistingVisitorKey(cookies(), request.headers);
    return ok(await withDb<TripsGetResponse>(
      async (db) => {
        const trips = await db.trip.findMany({ where: { visitorKey }, orderBy: { createdAt: "desc" }, take: 50 });
        return { status: "live", visitorScoped: true, memorySource: "cookie", trips: trips.map(tripViewFromDb), message: "Trips loaded for this browser memory." };
      },
      () => ({ status: "fallback", visitorScoped: true, memorySource: "fallback-headers", trips: [], message: "DATABASE_URL is not configured; saved trips are not persisted yet." })
    ));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const visitor = getOrCreateAnonymousVisitor(cookies(), request.headers);
    const body = await parseJson(request, {});
    const input = tripSchema.parse(body);
    const response = ok(await withDb<TripWriteResponse>(
      async (db) => {
        const created = await db.trip.create({
          data: {
            visitorKey: visitor.visitorKey,
            title: input.title,
            cityId: input.cityId,
            month: input.month,
            budgetLevel: input.budgetLevel,
            goal: input.goal,
            computedScore: input.computedScore,
            notes: input.notes
          }
        });
        return { status: "live", visitorScoped: true, memorySource: visitor.source, persisted: true, trip: tripViewFromDb(created), message: "Trip saved to anonymous browser memory." };
      },
      () => ({ status: "fallback", visitorScoped: true, memorySource: visitor.source, persisted: false, trip: fallbackTrip(input), message: "DATABASE_URL is not configured; this trip was not persisted." })
    ));

    if (visitor.shouldSetCookie && visitor.anonymousId) {
      const options = visitorCookieOptions();
      response.cookies.set(options.name, visitor.anonymousId, options);
    }

    return response;
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const visitorKey = getExistingVisitorKey(cookies(), request.headers);
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return ok({ status: "fallback", deleted: false, message: "Missing id." }, { status: 400 });
    return ok(await withDb(
      async (db) => {
        await db.trip.deleteMany({ where: { id, visitorKey } });
        return { status: "live", deleted: true, id, message: "Trip deleted from this browser memory." };
      },
      () => ({ status: "fallback", deleted: false, id, message: "DATABASE_URL is not configured; no persisted trip was deleted." })
    ));
  } catch (error) {
    return handleError(error);
  }
}
