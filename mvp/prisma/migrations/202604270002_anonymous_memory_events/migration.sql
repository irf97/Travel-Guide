ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "visitorKey" TEXT;
CREATE INDEX IF NOT EXISTS "Trip_visitorKey_idx" ON "Trip"("visitorKey");

CREATE TABLE IF NOT EXISTS "MemoryEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "visitorKey" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "cityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "MemoryEvent_visitorKey_idx" ON "MemoryEvent"("visitorKey");
CREATE INDEX IF NOT EXISTS "MemoryEvent_eventType_idx" ON "MemoryEvent"("eventType");
CREATE INDEX IF NOT EXISTS "MemoryEvent_cityId_idx" ON "MemoryEvent"("cityId");
