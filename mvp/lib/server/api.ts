import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: { message, details } }, { status });
}

export async function parseJson<T>(request: Request, fallback: T): Promise<unknown> {
  try {
    const text = await request.text();
    if (!text.trim()) return fallback;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) return fail("Validation failed", 422, error.flatten());
  if (error instanceof Error) return fail(error.message, 500);
  return fail("Unknown server error", 500);
}

export function nowIso() {
  return new Date().toISOString();
}
