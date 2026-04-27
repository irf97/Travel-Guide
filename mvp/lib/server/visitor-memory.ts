import { createHash, randomUUID } from "crypto";

const VISITOR_SALT = "social-travel-intelligence-os-v1";
export const VISITOR_COOKIE_NAME = "stio_visitor";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type HeaderReader = Pick<Headers, "get">;

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

function firstForwardedIp(value: string | null) {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

function isValidAnonymousId(value: string | undefined) {
  return Boolean(value && /^[a-zA-Z0-9_-]{24,96}$/.test(value));
}

export function getVisitorFingerprint(headers: HeaderReader) {
  const ip = firstForwardedIp(headers.get("x-forwarded-for"))
    ?? headers.get("x-real-ip")
    ?? headers.get("cf-connecting-ip")
    ?? headers.get("x-vercel-forwarded-for")
    ?? "unknown-ip";

  const country = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? "unknown-country";
  const region = headers.get("x-vercel-ip-country-region") ?? "unknown-region";
  const userAgent = headers.get("user-agent") ?? "unknown-agent";
  const language = headers.get("accept-language") ?? "unknown-language";

  return { ip, country, region, userAgent, language };
}

export function hashVisitorValue(value: string) {
  return createHash("sha256").update(`${VISITOR_SALT}|${value}`).digest("hex").slice(0, 32);
}

export function getHeaderFallbackVisitorKey(headers: HeaderReader) {
  const fingerprint = getVisitorFingerprint(headers);
  const raw = [fingerprint.ip, fingerprint.country, fingerprint.region, fingerprint.userAgent, fingerprint.language].join("|");
  return hashVisitorValue(`fallback|${raw}`);
}

export function getOrCreateAnonymousVisitor(cookies: CookieReader, headers: HeaderReader) {
  const existing = cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (isValidAnonymousId(existing)) {
    return {
      anonymousId: existing,
      visitorKey: hashVisitorValue(`cookie|${existing}`),
      source: "cookie" as const,
      shouldSetCookie: false
    };
  }

  const anonymousId = randomUUID().replace(/-/g, "");
  return {
    anonymousId,
    visitorKey: hashVisitorValue(`cookie|${anonymousId}`),
    fallbackVisitorKey: getHeaderFallbackVisitorKey(headers),
    source: "new-cookie" as const,
    shouldSetCookie: true
  };
}

export function getExistingVisitorKey(cookies: CookieReader, headers: HeaderReader) {
  const existing = cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (isValidAnonymousId(existing)) return hashVisitorValue(`cookie|${existing}`);
  return getHeaderFallbackVisitorKey(headers);
}

export function visitorCookieOptions() {
  return {
    name: VISITOR_COOKIE_NAME,
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/"
  };
}
