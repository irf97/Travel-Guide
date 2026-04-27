import type { SourceLabel } from './providers/provider-types';

export type Month = 'Jan'|'Feb'|'Mar'|'Apr'|'May'|'Jun'|'Jul'|'Aug'|'Sep'|'Oct'|'Nov'|'Dec';
export type CityIntelligence = {
  id: string; slug: string; name: string; country: string; region: string;
  latitude: number; longitude: number; markerX: number; markerY: number;
  scores: { overall: number; nightlife: number; history: number; international: number; affordability: number; safety: number; weatherComfort: number; beachNature: number; poiDensity: number; tourismDemand: number; genderBalance: number; investorOpportunity: number; confidence: number };
  bestMonths: Month[]; estimatedBudget: number; localTouristSplit: { locals: number; tourists: number };
  genderRatio: { male: number; female: number };
  touristNationalities: { label: string; value: number }[]; localNationalities: { label: string; value: number }[];
  vibeTags: string[]; crowdTypes: string[]; strategicVerdict: string; opportunityNotes: string; warningNotes: string;
  sourceLabel: SourceLabel; sourceSummary: string; lastUpdated: string; isEstimated: boolean;
};

const now = '2026-04-27';
const baseNat = [{ label: 'Domestic', value: 32 }, { label: 'UK', value: 13 }, { label: 'German', value: 10 }, { label: 'French', value: 8 }, { label: 'Dutch', value: 6 }, { label: 'Other', value: 31 }];
const localNat = (local: string) => [{ label: local, value: 82 }, { label: 'International residents', value: 10 }, { label: 'EU migrants', value: 5 }, { label: 'Other', value: 3 }];

function city(id: string, name: string, country: string, region: string, x: number, y: number, overall: number, nightlife: number, history: number, affordability: number, months: Month[], tags: string[]): CityIntelligence {
  const international = Math.round((overall + nightlife + 85) / 3);
  const poiDensity = Math.round((nightlife + history + overall) / 3);
  const tourismDemand = Math.round((overall + international + history) / 3);
  const investorOpportunity = Math.round((poiDensity + tourismDemand + affordability) / 3);
  return {
    id, slug: id, name, country, region, latitude: 0, longitude: 0, markerX: x, markerY: y,
    scores: { overall, nightlife, history, international, affordability, safety: 74, weatherComfort: 78, beachNature: tags.includes('beach') ? 88 : 58, poiDensity, tourismDemand, genderBalance: 72, investorOpportunity, confidence: 48 },
    bestMonths: months, estimatedBudget: Math.max(540, Math.round(1250 - affordability * 7)),
    localTouristSplit: { locals: 66, tourists: 34 }, genderRatio: { male: 51, female: 49 },
    touristNationalities: baseNat, localNationalities: localNat(country === 'Turkey' ? 'Turkish' : country === 'Spain' ? 'Spanish' : country === 'Portugal' ? 'Portuguese' : country === 'Italy' ? 'Italian' : country === 'Greece' ? 'Greek' : 'Local'),
    vibeTags: tags, crowdTypes: ['Young Professionals','Students','Backpackers','Digital Nomads'],
    strategicVerdict: `${name} is a strong comparison city for social travel demand, nightlife/culture density, and investor-facing opportunity modeling.`,
    opportunityNotes: 'Fallback model combines curated baseline scores with open-data-ready source placeholders. Replace with normalized ingestion outputs as providers come online.',
    warningNotes: 'Model estimate. Verify costs, crowd composition, safety, and live conditions before booking or investing.',
    sourceLabel: 'Fallback estimate', sourceSummary: 'Fallback seed dataset until Supabase/open-data ingestion is configured.', lastUpdated: now, isEstimated: true
  };
}

export const fallbackCities: CityIntelligence[] = [
  city('barcelona','Barcelona','Spain','Mediterranean',42,48,89,96,95,52,['May','Jun','Sep'],['nightlife','history','international','beach']),
  city('lisbon','Lisbon','Portugal','Europe',32,46,86,91,92,70,['May','Jun','Sep','Oct'],['nightlife','history','digital nomads']),
  city('valencia','Valencia','Spain','Mediterranean',40,52,91,88,86,84,['May','Jun','Sep'],['beach','nightlife','history','budget']),
  city('budapest','Budapest','Hungary','Europe',52,43,84,90,90,89,['Apr','May','Jun','Sep'],['nightlife','history','budget']),
  city('prague','Prague','Czech Republic','Europe',50,39,83,88,94,78,['Apr','May','Sep','Oct'],['history','nightlife']),
  city('krakow','Krakow','Poland','Europe',53,36,79,82,90,91,['May','Jun','Sep'],['history','budget','students']),
  city('belgrade','Belgrade','Serbia','Balkans',56,49,78,92,78,92,['May','Jun','Sep'],['nightlife','budget','hidden gem']),
  city('split','Split','Croatia','Mediterranean',55,56,80,78,92,70,['Jun','Jul','Sep'],['beach','history','seasonal']),
  city('athens','Athens','Greece','Mediterranean',59,60,82,86,100,72,['Apr','May','Sep','Oct'],['history','nightlife']),
  city('istanbul','Istanbul','Turkey','MENA',65,52,85,88,100,76,['Apr','May','Sep','Oct'],['history','mega city','nightlife']),
  city('rome','Rome','Italy','Mediterranean',53,55,82,78,100,60,['Apr','May','Sep','Oct'],['history','international']),
  city('naples','Naples','Italy','Mediterranean',54,57,77,75,93,82,['May','Jun','Sep'],['history','food','budget']),
  city('berlin','Berlin','Germany','Europe',51,34,84,98,78,58,['May','Jun','Jul','Sep'],['nightlife','international','creative']),
  city('amsterdam','Amsterdam','Netherlands','Europe',47,32,81,86,86,45,['May','Jun','Sep'],['international','nightlife','expensive']),
  city('porto','Porto','Portugal','Europe',31,43,78,77,90,86,['May','Jun','Sep','Oct'],['history','budget']),
  city('thessaloniki','Thessaloniki','Greece','Balkans',60,55,76,84,84,88,['May','Jun','Sep'],['students','nightlife','budget']),
  city('sofia','Sofia','Bulgaria','Balkans',58,47,72,76,78,94,['May','Jun','Sep'],['budget','students']),
  city('tbilisi','Tbilisi','Georgia','Global',70,47,74,77,82,90,['May','Jun','Sep','Oct'],['hidden gem','budget','history']),
  city('marrakech','Marrakech','Morocco','MENA',43,66,73,64,89,78,['Mar','Apr','Oct','Nov'],['history','markets','warm']),
  city('antalya','Antalya','Turkey','MENA',64,61,74,70,84,92,['May','Jun','Sep','Oct'],['beach','resort','budget'])
];

export const fallbackProviderStatuses = [
  'Open-Meteo','Overture Maps','FSQ OS Places','Overpass','Nominatim','Photon','World Bank','OECD','Eurostat','Wikidata','OWID','GDELT','Amadeus','LiteAPI','Ticketmaster'
].map((provider) => ({ provider, status: provider === 'Open-Meteo' ? 'available_for_server_refresh' : 'not_configured_or_scaffolded', configured: false, lastUpdated: now }));
