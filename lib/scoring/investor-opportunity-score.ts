import type { CityIntelligence } from '../fallback-data';

export function computeInvestorOpportunityScore(city: CityIntelligence): number {
  const s = city.scores;
  return Math.round(s.poiDensity * .22 + s.tourismDemand * .22 + s.affordability * .18 + s.nightlife * .14 + s.international * .14 + s.confidence * .1);
}
