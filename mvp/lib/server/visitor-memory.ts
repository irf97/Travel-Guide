import { createHash } from "crypto";

const VISITOR_SALT = "social-travel-intelligence-os-v1";

type HeaderReader = Pick<Headers, "get">;

function firstForwardedIp(value: string | null) {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
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

export function getVisitorKey(headers: HeaderReader) {
  const fingerprint = getVisitorFingerprint(headers);
  const raw = [VISITOR_SALT, fingerprint.ip, fingerprint.country, fingerprint.region, fingerprint.userAgent, fingerprint.language].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}
