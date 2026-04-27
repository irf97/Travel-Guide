-- Full backend schema baseline for Social Travel Intelligence OS.
-- Apply with: npm run prisma:deploy after DATABASE_URL is configured.
-- If your database is empty, this creates the current Prisma schema.

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT UNIQUE,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PreferenceProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rawInput" TEXT NOT NULL,
  "intent" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Trip" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "title" TEXT NOT NULL,
  "cityId" TEXT,
  "month" TEXT,
  "budgetLevel" TEXT,
  "goal" TEXT,
  "computedScore" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "preferenceProfileId" TEXT,
  CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Trip_preferenceProfileId_fkey" FOREIGN KEY ("preferenceProfileId") REFERENCES "PreferenceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "City" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "continent" TEXT NOT NULL DEFAULT 'Europe',
  "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lng" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "types" TEXT[] NOT NULL,
  "baseCostPerPerson" INTEGER NOT NULL,
  "averageDailyCost" INTEGER NOT NULL,
  "socialDensityScore" INTEGER NOT NULL,
  "nightlifeScore" INTEGER NOT NULL,
  "historyScore" INTEGER NOT NULL,
  "foodCultureScore" INTEGER NOT NULL,
  "mobilityScore" INTEGER NOT NULL,
  "seaAccess" BOOLEAN NOT NULL,
  "crowdPressureByMonth" JSONB NOT NULL,
  "seasonalityByMonth" JSONB NOT NULL,
  "bestNeighborhoods" TEXT[] NOT NULL,
  "riskFlags" TEXT[] NOT NULL,
  "nationalityMixContext" TEXT NOT NULL,
  "notes" TEXT NOT NULL,
  "sourceSummary" JSONB,
  "confidenceScore" INTEGER NOT NULL DEFAULT 50,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Neighborhood" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "cityId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "notes" TEXT,
  "score" INTEGER,
  CONSTRAINT "Neighborhood_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Place" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "neighborhood" TEXT NOT NULL,
  "ambienceTags" TEXT[] NOT NULL,
  "featureTags" TEXT[] NOT NULL,
  "priceLevel" INTEGER NOT NULL,
  "socialAmbienceScore" INTEGER NOT NULL,
  "evidenceConfidenceScore" INTEGER NOT NULL,
  "businessConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "goodFor" TEXT[] NOT NULL,
  "notes" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'modeled',
  "confidence" TEXT NOT NULL DEFAULT 'medium',
  "releaseId" TEXT,
  "ingestedAt" TIMESTAMP(3),
  CONSTRAINT "Place_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Place_cityId_idx" ON "Place"("cityId");
CREATE INDEX IF NOT EXISTS "Place_type_idx" ON "Place"("type");

CREATE TABLE IF NOT EXISTS "PlaceFeature" ("id" TEXT NOT NULL PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT);
CREATE TABLE IF NOT EXISTS "PlaceImage" ("id" TEXT NOT NULL PRIMARY KEY, "placeId" TEXT, "businessProfileId" TEXT, "url" TEXT NOT NULL, "storagePath" TEXT, "bucket" TEXT, "category" TEXT NOT NULL, "analysis" JSONB, "consentConfirmed" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "PlaceAiTag" ("id" TEXT NOT NULL PRIMARY KEY, "placeId" TEXT NOT NULL, "tags" JSONB NOT NULL, "confidence" JSONB NOT NULL, "provider" TEXT NOT NULL DEFAULT 'local', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "BusinessClaim" ("id" TEXT NOT NULL PRIMARY KEY, "placeId" TEXT, "businessName" TEXT NOT NULL, "claimantEmail" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "BusinessProfile" ("id" TEXT NOT NULL PRIMARY KEY, "placeId" TEXT, "profile" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "Event" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "category" TEXT NOT NULL, "cityId" TEXT NOT NULL, "tags" TEXT[] NOT NULL, "notes" TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "Recommendation" ("id" TEXT NOT NULL PRIMARY KEY, "tripId" TEXT NOT NULL, "type" TEXT NOT NULL, "targetId" TEXT NOT NULL, "score" INTEGER NOT NULL, "reason" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "ItineraryRoute" ("id" TEXT NOT NULL PRIMARY KEY, "tripId" TEXT NOT NULL, "route" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "UserFeedback" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "targetType" TEXT NOT NULL, "targetId" TEXT NOT NULL, "rating" INTEGER NOT NULL, "matchedExpectation" BOOLEAN, "crowdAccuracy" INTEGER, "socialAccuracy" INTEGER, "budgetAccuracy" INTEGER, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "eventName" TEXT NOT NULL, "cityId" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventName_idx" ON "AnalyticsEvent"("eventName");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_cityId_idx" ON "AnalyticsEvent"("cityId");

CREATE TABLE IF NOT EXISTS "ProviderStatus" ("id" TEXT NOT NULL PRIMARY KEY, "provider" TEXT NOT NULL UNIQUE, "status" TEXT NOT NULL, "configured" BOOLEAN NOT NULL DEFAULT false, "requiresKey" BOOLEAN NOT NULL DEFAULT false, "lastSuccessAt" TIMESTAMP(3), "lastErrorAt" TIMESTAMP(3), "lastError" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "RawSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "source" TEXT NOT NULL, "endpoint" TEXT, "status" TEXT NOT NULL, "cityId" TEXT, "payload" JSONB, "error" TEXT, "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS "RawSnapshot_source_idx" ON "RawSnapshot"("source");
CREATE INDEX IF NOT EXISTS "RawSnapshot_cityId_idx" ON "RawSnapshot"("cityId");
CREATE TABLE IF NOT EXISTS "ProviderSignal" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT, "provider" TEXT NOT NULL, "signalType" TEXT NOT NULL, "score" INTEGER, "confidenceScore" INTEGER NOT NULL DEFAULT 50, "sourceLabel" TEXT NOT NULL DEFAULT 'fallback', "payload" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS "ProviderSignal_provider_idx" ON "ProviderSignal"("provider");
CREATE INDEX IF NOT EXISTS "ProviderSignal_signalType_idx" ON "ProviderSignal"("signalType");
CREATE TABLE IF NOT EXISTS "PriceSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT, "source" TEXT NOT NULL, "priceType" TEXT NOT NULL, "value" DOUBLE PRECISION, "currency" TEXT NOT NULL DEFAULT 'EUR', "periodStart" TIMESTAMP(3), "periodEnd" TIMESTAMP(3), "confidenceScore" INTEGER NOT NULL DEFAULT 50, "payload" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS "PriceSnapshot_cityId_idx" ON "PriceSnapshot"("cityId");
CREATE INDEX IF NOT EXISTS "PriceSnapshot_priceType_idx" ON "PriceSnapshot"("priceType");

CREATE TABLE IF NOT EXISTS "VenueDensitySnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT NOT NULL, "category" TEXT NOT NULL, "count" INTEGER NOT NULL, "densityKm2" DOUBLE PRECISION, "source" TEXT NOT NULL DEFAULT 'open-bulk', "confidence" TEXT NOT NULL DEFAULT 'medium', "releaseId" TEXT, "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "payload" JSONB);
CREATE INDEX IF NOT EXISTS "VenueDensitySnapshot_cityId_idx" ON "VenueDensitySnapshot"("cityId");
CREATE INDEX IF NOT EXISTS "VenueDensitySnapshot_category_idx" ON "VenueDensitySnapshot"("category");
CREATE TABLE IF NOT EXISTS "EventSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT NOT NULL, "eventDate" TIMESTAMP(3), "eventType" TEXT NOT NULL, "volume" INTEGER NOT NULL DEFAULT 0, "toneScore" DOUBLE PRECISION, "source" TEXT NOT NULL DEFAULT 'open-bulk', "confidence" TEXT NOT NULL DEFAULT 'medium', "releaseId" TEXT, "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "payload" JSONB);
CREATE INDEX IF NOT EXISTS "EventSnapshot_cityId_idx" ON "EventSnapshot"("cityId");
CREATE INDEX IF NOT EXISTS "EventSnapshot_eventType_idx" ON "EventSnapshot"("eventType");
CREATE TABLE IF NOT EXISTS "DemandPressureSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT NOT NULL, "pressureDate" TIMESTAMP(3) NOT NULL, "score" DOUBLE PRECISION NOT NULL, "components" JSONB NOT NULL, "source" TEXT NOT NULL DEFAULT 'modeled', "confidence" TEXT NOT NULL DEFAULT 'medium', "releaseId" TEXT, "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS "DemandPressureSnapshot_cityId_idx" ON "DemandPressureSnapshot"("cityId");
CREATE INDEX IF NOT EXISTS "DemandPressureSnapshot_pressureDate_idx" ON "DemandPressureSnapshot"("pressureDate");
CREATE TABLE IF NOT EXISTS "NewsSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT NOT NULL, "newsDate" TIMESTAMP(3) NOT NULL, "articleCount" INTEGER NOT NULL DEFAULT 0, "toneScore" DOUBLE PRECISION, "themeDistribution" JSONB, "source" TEXT NOT NULL DEFAULT 'open-live', "confidence" TEXT NOT NULL DEFAULT 'medium', "releaseId" TEXT, "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "payload" JSONB);
CREATE INDEX IF NOT EXISTS "NewsSnapshot_cityId_idx" ON "NewsSnapshot"("cityId");
CREATE INDEX IF NOT EXISTS "NewsSnapshot_newsDate_idx" ON "NewsSnapshot"("newsDate");
CREATE TABLE IF NOT EXISTS "WeatherSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT NOT NULL, "weatherDate" TIMESTAMP(3) NOT NULL, "temperatureAvg" DOUBLE PRECISION, "precipitationProbability" DOUBLE PRECISION, "comfortScore" DOUBLE PRECISION, "source" TEXT NOT NULL DEFAULT 'open-live', "confidence" TEXT NOT NULL DEFAULT 'high', "releaseId" TEXT, "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "payload" JSONB);
CREATE INDEX IF NOT EXISTS "WeatherSnapshot_cityId_idx" ON "WeatherSnapshot"("cityId");
CREATE INDEX IF NOT EXISTS "WeatherSnapshot_weatherDate_idx" ON "WeatherSnapshot"("weatherDate");
CREATE TABLE IF NOT EXISTS "DemographicSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT, "countryCode" TEXT, "metric" TEXT NOT NULL, "value" DOUBLE PRECISION, "period" TEXT, "source" TEXT NOT NULL DEFAULT 'official', "confidence" TEXT NOT NULL DEFAULT 'high', "releaseId" TEXT, "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "payload" JSONB);
CREATE INDEX IF NOT EXISTS "DemographicSnapshot_cityId_idx" ON "DemographicSnapshot"("cityId");
CREATE INDEX IF NOT EXISTS "DemographicSnapshot_countryCode_idx" ON "DemographicSnapshot"("countryCode");
CREATE INDEX IF NOT EXISTS "DemographicSnapshot_metric_idx" ON "DemographicSnapshot"("metric");
CREATE TABLE IF NOT EXISTS "TouristStatSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT, "regionCode" TEXT, "metric" TEXT NOT NULL, "value" DOUBLE PRECISION, "period" TEXT, "source" TEXT NOT NULL DEFAULT 'official', "confidence" TEXT NOT NULL DEFAULT 'medium', "releaseId" TEXT, "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "payload" JSONB);
CREATE INDEX IF NOT EXISTS "TouristStatSnapshot_cityId_idx" ON "TouristStatSnapshot"("cityId");
CREATE INDEX IF NOT EXISTS "TouristStatSnapshot_regionCode_idx" ON "TouristStatSnapshot"("regionCode");
CREATE INDEX IF NOT EXISTS "TouristStatSnapshot_metric_idx" ON "TouristStatSnapshot"("metric");
CREATE TABLE IF NOT EXISTS "FlightPriceSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "origin" TEXT NOT NULL, "destination" TEXT NOT NULL, "departDate" TIMESTAMP(3) NOT NULL, "returnDate" TIMESTAMP(3), "value" DOUBLE PRECISION, "currency" TEXT NOT NULL DEFAULT 'EUR', "source" TEXT NOT NULL DEFAULT 'commercial', "confidence" TEXT NOT NULL DEFAULT 'medium', "releaseId" TEXT, "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "payload" JSONB);
CREATE INDEX IF NOT EXISTS "FlightPriceSnapshot_origin_idx" ON "FlightPriceSnapshot"("origin");
CREATE INDEX IF NOT EXISTS "FlightPriceSnapshot_destination_idx" ON "FlightPriceSnapshot"("destination");
CREATE INDEX IF NOT EXISTS "FlightPriceSnapshot_departDate_idx" ON "FlightPriceSnapshot"("departDate");
CREATE TABLE IF NOT EXISTS "HotelPriceSnapshot" ("id" TEXT NOT NULL PRIMARY KEY, "cityId" TEXT NOT NULL, "checkIn" TIMESTAMP(3) NOT NULL, "checkOut" TIMESTAMP(3) NOT NULL, "value" DOUBLE PRECISION, "currency" TEXT NOT NULL DEFAULT 'EUR', "source" TEXT NOT NULL DEFAULT 'commercial', "confidence" TEXT NOT NULL DEFAULT 'medium', "releaseId" TEXT, "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "payload" JSONB);
CREATE INDEX IF NOT EXISTS "HotelPriceSnapshot_cityId_idx" ON "HotelPriceSnapshot"("cityId");
CREATE INDEX IF NOT EXISTS "HotelPriceSnapshot_checkIn_idx" ON "HotelPriceSnapshot"("checkIn");

CREATE TABLE IF NOT EXISTS "IngestionRun" ("id" TEXT NOT NULL PRIMARY KEY, "source" TEXT NOT NULL, "jobType" TEXT NOT NULL, "status" TEXT NOT NULL, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "finishedAt" TIMESTAMP(3), "rowsProcessed" INTEGER NOT NULL DEFAULT 0, "error" TEXT, "metadata" JSONB);
CREATE TABLE IF NOT EXISTS "CostModelRun" ("id" TEXT NOT NULL PRIMARY KEY, "input" JSONB NOT NULL, "output" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "AuditLog" ("id" TEXT NOT NULL PRIMARY KEY, "actorId" TEXT, "action" TEXT NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
