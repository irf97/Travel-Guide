import { handleError, ok, parseJson } from "@/lib/server/api";
import { withDb } from "@/lib/server/db";
import { getExistingVisitorKey, getOrCreateAnonymousVisitor, visitorCookieOptions } from "@/lib/server/visitor-memory";
import { cookies } from "next/headers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const memoryEventSchema = z.object({
  eventType: z.enum(["city_view", "city_favorite", "city_reject", "city_select", "filter_change"]),
  cityId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

function summarize(events: Array<{ eventType: string; cityId: string | null }>, trips: Array<{ cityId: string | null; budgetLevel: string | null; goal: string | null; month: string | null }>) {
  const counts = new Map<string, number>();
  const rejected = new Set<string>();
  for (const event of events) {
    if (!event.cityId) continue;
    if (event.eventType === "city_reject") rejected.add(event.cityId);
    counts.set(event.cityId, (counts.get(event.cityId) ?? 0) + (event.eventType === "city_favorite" ? 4 : event.eventType === "city_select" ? 2 : 1));
  }
  for (const trip of trips) if (trip.cityId) counts.set(trip.cityId, (counts.get(trip.cityId) ?? 0) + 6);
  const favoriteCityIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([cityId]) => cityId).slice(0, 10);
  const preferredBudget = trips.find((trip) => trip.budgetLevel)?.budgetLevel ?? null;
  const preferredGoal = trips.find((trip) => trip.goal)?.goal ?? null;
  const preferredMonth = trips.find((trip) => trip.month)?.month ?? null;
  return { favoriteCityIds, rejectedCityIds: [...rejected], preferredBudget, preferredGoal, preferredMonth, eventCount: events.length, savedTripCount: trips.length };
}

export async function GET(request: Request) {
  try {
    const visitorKey = getExistingVisitorKey(cookies(), request.headers);
    return ok(await withDb(
      async (db) => {
        const [events, trips] = await Promise.all([
          db.memoryEvent.findMany({ where: { visitorKey }, orderBy: { createdAt: "desc" }, take: 200, select: { eventType: true, cityId: true } }),
          db.trip.findMany({ where: { visitorKey }, orderBy: { createdAt: "desc" }, take: 100, select: { cityId: true, budgetLevel: true, goal: true, month: true } })
        ]);
        return { status: "live", visitorScoped: true, memory: summarize(events, trips), message: "Anonymous memory loaded." };
      },
      () => ({ status: "fallback", visitorScoped: true, memory: summarize([], []), message: "DATABASE_URL is not configured; memory is not persisted yet." })
    ));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const visitor = getOrCreateAnonymousVisitor(cookies(), request.headers);
    const body = await parseJson(request, {});
    const input = memoryEventSchema.parse(body);
    const response = ok(await withDb(
      async (db) => {
        const event = await db.memoryEvent.create({ data: { visitorKey: visitor.visitorKey, eventType: input.eventType, cityId: input.cityId, metadata: input.metadata } });
        return { status: "live", persisted: true, eventId: event.id, memorySource: visitor.source, message: "Memory event persisted." };
      },
      () => ({ status: "fallback", persisted: false, memorySource: visitor.source, message: "DATABASE_URL is not configured; memory event was not persisted." })
    ));
    if (visitor.shouldSetCookie) {
      const options = visitorCookieOptions();
      response.cookies.set(options.name, visitor.anonymousId, options);
    }
    return response;
  } catch (error) {
    return handleError(error);
  }
}
