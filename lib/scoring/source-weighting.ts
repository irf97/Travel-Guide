import type { SourceLabel } from '../providers/provider-types';

export function sourceWeight(label: SourceLabel): number {
  switch (label) {
    case 'Official': return 1;
    case 'Commercial source': return 0.88;
    case 'Open-data model': return 0.76;
    case 'Fallback estimate': return 0.42;
    case 'Low confidence': return 0.22;
    case 'Not configured': return 0;
  }
}

export function recencyWeight(daysOld: number): number {
  if (daysOld <= 7) return 1;
  if (daysOld <= 30) return 0.85;
  if (daysOld <= 90) return 0.65;
  if (daysOld <= 365) return 0.4;
  return 0.2;
}
