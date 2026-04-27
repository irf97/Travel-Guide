import type { CityIntelligence, Month } from '../fallback-data';

type ScoreOptions = { month?: Month; goal?: string; budget?: string; crowdType?: string; mode?: 'traveler' | 'investor' };

export function computeCityScore(city: CityIntelligence, options: ScoreOptions = {}): number {
  const s = city.scores;
  let score = s.overall;
  const goal = options.goal ?? 'overall';
  if (goal === 'nightlife') score = s.overall * .35 + s.nightlife * .65;
  if (goal === 'history') score = s.overall * .35 + s.history * .65;
  if (goal === 'international') score = s.overall * .35 + s.international * .65;
  if (goal === 'affordability') score = s.overall * .3 + s.affordability * .7;
  if (goal === 'weather') score = s.overall * .35 + s.weatherComfort * .65;
  if (goal === 'poi') score = s.overall * .3 + s.poiDensity * .7;
  if (goal === 'dating') score = s.nightlife * .35 + s.international * .35 + s.genderBalance * .3;
  if (options.mode === 'investor') score = score * .55 + s.investorOpportunity * .45;
  if (options.month && city.bestMonths.includes(options.month)) score += 4;
  if (options.budget === 'Low') score = score * .72 + s.affordability * .28;
  if (options.budget === 'Medium') score = score * .86 + s.affordability * .14;
  if (options.crowdType && city.crowdTypes.includes(options.crowdType)) score += 2;
  score = score * .9 + s.confidence * .1;
  return Math.max(0, Math.min(100, Math.round(score)));
}
