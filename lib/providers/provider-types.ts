export type ProviderStatus = 'ok' | 'not_configured' | 'provider_error' | 'fallback';
export type SourceType = 'official' | 'open_data' | 'commercial' | 'fallback';
export type SourceLabel = 'Official' | 'Open-data model' | 'Commercial source' | 'Fallback estimate' | 'Low confidence' | 'Not configured';

export type ProviderResult<T> = {
  status: ProviderStatus;
  source: string;
  sourceType: SourceType;
  sourceLabel: SourceLabel;
  confidenceScore: number;
  data: T | null;
  error?: string;
  fetchedAt: string;
};

export function providerResult<T>(input: Omit<ProviderResult<T>, 'fetchedAt'>): ProviderResult<T> {
  return { ...input, fetchedAt: new Date().toISOString() };
}

export function notConfigured<T>(source: string, sourceType: SourceType = 'open_data', message = 'Provider is not configured'): ProviderResult<T> {
  return providerResult<T>({
    status: 'not_configured',
    source,
    sourceType,
    sourceLabel: 'Not configured',
    confidenceScore: 0,
    data: null,
    error: message
  });
}

export function providerError<T>(source: string, sourceType: SourceType, error: unknown): ProviderResult<T> {
  return providerResult<T>({
    status: 'provider_error',
    source,
    sourceType,
    sourceLabel: 'Low confidence',
    confidenceScore: 0.1,
    data: null,
    error: error instanceof Error ? error.message : String(error)
  });
}

export function fallbackResult<T>(source: string, data: T, confidenceScore = 0.42): ProviderResult<T> {
  return providerResult<T>({
    status: 'fallback',
    source,
    sourceType: 'fallback',
    sourceLabel: 'Fallback estimate',
    confidenceScore,
    data
  });
}
