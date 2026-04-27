import OpenAI from "openai";

export type AiAdapterStatus = {
  configured: boolean;
  provider: "openai" | "local-fallback";
  reason?: string;
};

export function getAiAdapterStatus(): AiAdapterStatus {
  if (!process.env.OPENAI_API_KEY) {
    return { configured: false, provider: "local-fallback", reason: "OPENAI_API_KEY is not configured" };
  }
  return { configured: true, provider: "openai" };
}

export function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function analyzeImageSafely(input: { imageUrls: string[]; useAi?: boolean }) {
  const client = input.useAi ? getOpenAIClient() : null;
  if (!client) {
    return {
      provider: "local-fallback",
      configured: false,
      labels: ["venue", "ambience", "manual-review-required"],
      confidence: 0.28,
      notes: "OpenAI image analysis is gated and not configured or not requested. Returned deterministic fallback tags."
    };
  }

  return {
    provider: "openai-ready",
    configured: true,
    labels: ["ai-adapter-ready"],
    confidence: 0.5,
    notes: "OpenAI client is configured, but paid image analysis remains intentionally gated until a final prompt is enabled."
  };
}
