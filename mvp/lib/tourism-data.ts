import tourismSnapshot from "@/data/tourism/eurostat-tourism-baselines.json";
import type { WorldCity } from "./world-data";

type CountryTourismBaseline = {
  geo: string;
  tourism_nights_index: number;
  international_guest_share: number;
  domestic_guest_share: number;
  source_label: string;
  confidence: "low" | "medium" | "high";
  raw_total_nights_2024?: number | null;
  raw_international_nights_2024?: number | null;
  error?: string;
};

type StoredTourismSnapshot = {
  version: string;
  source: string;
  source_url?: string;
  dataset_codes?: string[];
  license?: string;
  last_downloaded_at: string | null;
  status: string;
  note?: string;
  eu_2024?: {
    tourism_nights_total: number;
    domestic_guest_share: number;
    international_guest_share: number;
    source_label: string;
    confidence: "low" | "medium" | "high";
  };
  countries: Record<string, CountryTourismBaseline>;
};

export type CityTourismModel = {
  country: string;
  geo: string | null;
  tourismNightsIndex: number;
  internationalGuestShare: number;
  domesticGuestShare: number;
  cityTourismDemandScore: number;
  internationalTouristPressure: number;
  sourceLabel: string;
  confidence: "low" | "medium" | "high";
  release: string;
  status: string;
  note: string;
};

const snapshot = tourismSnapshot as StoredTourismSnapshot;

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function fallbackCountry(country: string): CountryTourismBaseline {
  return {
    geo: country.slice(0, 2).toUpperCase(),
    tourism_nights_index: 55,
    international_guest_share: 35,
    domestic_guest_share: 65,
    source_label: "Fallback tourism estimate",
    confidence: "low"
  };
}

export function getCountryTourismBaseline(country: string): CountryTourismBaseline {
  return snapshot.countries[country] ?? fallbackCountry(country);
}

export function getCityTourismModel(city: WorldCity): CityTourismModel {
  const baseline = getCountryTourismBaseline(city.country);
  const cityMultiplier =
    (city.sea_access ? 8 : 0) +
    (city.history_score > 90 ? 6 : 0) +
    (city.nightlife_score > 86 ? 6 : 0) +
    (city.social_density_score > 88 ? 5 : 0) -
    (city.mobility_score < 60 ? 5 : 0);
  const cityTourismDemandScore = clamp(baseline.tourism_nights_index * 0.72 + cityMultiplier + city.social_density_score * 0.18);
  const internationalTouristPressure = clamp(baseline.international_guest_share * 0.72 + city.nightlife_score * 0.16 + city.social_density_score * 0.12);
  return {
    country: city.country,
    geo: baseline.geo,
    tourismNightsIndex: baseline.tourism_nights_index,
    internationalGuestShare: baseline.international_guest_share,
    domesticGuestShare: baseline.domestic_guest_share,
    cityTourismDemandScore,
    internationalTouristPressure,
    sourceLabel: baseline.source_label,
    confidence: baseline.confidence,
    release: snapshot.version,
    status: snapshot.status,
    note: "Country tourism baseline is loaded from stored downloadable-data snapshot. City score is derived from baseline plus city attributes until region/city-level official data is ingested."
  };
}

export function getStoredTourismSnapshot(): StoredTourismSnapshot {
  return snapshot;
}
