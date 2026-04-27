# Open-Data Ingestion Architecture

The product is not a frontend wrapper around travel APIs. It is a local city intelligence layer built from bulk/open datasets, cached live APIs, and commercial gap-fillers only where open data cannot answer the question.

```text
External open/commercial sources
        ↓
Ingestion jobs
        ↓
Raw snapshots
        ↓
Normalized city intelligence tables
        ↓
Scoring engine
        ↓
Internal API routes
        ↓
Frontend dashboards
```

## Bulk datasets

These sync into Postgres and/or Parquet storage on a slow cadence:

- Overture Maps Places and transportation
- FSQ OS Places, currently gated through HuggingFace token for newer releases
- Geofabrik OSM regional extracts
- World Bank indicators
- OECD SDMX
- Eurostat tourism/statistics
- Wikidata seed entities
- GDELT event/doc aggregates

## Live APIs

These are called only server-side and cached aggressively:

- Open-Meteo current + 7-day forecast: cache 1 hour
- Overpass local POI query: cache 24 hours per `(bbox, query)` pair
- Nominatim geocoding: cache 30 days per query string

Self-host Overpass and Nominatim/Photon before meaningful production traffic.

## Commercial gap-fillers

Use only where the open ecosystem does not have a real substitute:

- Amadeus/Duffel for flight pricing
- LiteAPI/Amadeus Hotels for hotel pricing

## Cadence

### Monthly, 1st of month, off-peak

- `sync_overture_places`
- `sync_overture_transportation`
- `sync_fsq_os_places`
- `sync_worldbank_indicators`
- `sync_oecd_tourism`
- `sync_eurostat_tourism`
- `rebuild_venue_density_snapshots`

### Weekly, Sunday night UTC

- `sync_geofabrik_extracts`
- `refresh_wikidata_seed`
- `aggregate_gdelt_weekly`

### Daily, early UTC

- `sync_gdelt_events_daily`
- `sync_gdelt_doc_daily`
- `compute_demand_pressure`
- `refresh_amadeus_routes`
- `refresh_liteapi_hotels`

### On-demand, cached

- Open-Meteo current + 7-day forecast
- Overpass live POI query
- Nominatim geocoding

## Snapshot tables

- `places`
- `venue_density_snapshots`
- `event_snapshots`
- `demand_pressure_snapshots`
- `news_snapshots`
- `weather_snapshots`
- `demographic_snapshots`
- `tourist_stat_snapshots`
- `flight_price_snapshots`
- `hotel_price_snapshots`

Every row should expose:

- `source`: `official | open-bulk | open-live | commercial | modeled`
- `confidence`: `high | medium | low`
- `release_id`
- `ingested_at`

## Critical notes

- FSQ OS Places newer access is through HuggingFace; code both HF and older S3-style paths so token outages do not stall ingestion.
- Overture is the primary POI foundation because GERS provides persistent identity across releases.
- FSQ OS Places fills gaps where Overture is sparse.
- Filter GDELT at ingest by tracked countries/regions; never store the full feed.
- Heavy Overture/FSQ/Geofabrik jobs must not run in Vercel serverless functions. Use GitHub Actions, Hetzner, or a worker.
