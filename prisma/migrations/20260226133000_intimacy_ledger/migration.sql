-- Intimacy ledger (events) for auditing and anti-duplication

CREATE TYPE "IntimacyEventType" AS ENUM (
  'LEGACY_IMPORT',
  'NOTE_CREATE',
  'NOTE_DELETE',
  'MOMENT_CREATE',
  'MOMENT_DELETE',
  'QUEST_CREATE',
  'QUEST_DELETE',
  'QUEST_COMPLETE',
  'PAIR_SUCCESS',
  'ANNIVERSARY_SET',
  'SURPRISE_CLICK',
  'ROMANTIC_ACTION'
);

CREATE TABLE "IntimacyEvent" (
  "id" VARCHAR(32) NOT NULL,
  "coupleId" VARCHAR(32) NOT NULL,
  "userId" VARCHAR(32),
  "type" "IntimacyEventType" NOT NULL,
  "points" INTEGER NOT NULL,
  "dedupeKey" VARCHAR(140) NOT NULL,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntimacyEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "IntimacyEvent"
ADD CONSTRAINT "IntimacyEvent_coupleId_fkey"
FOREIGN KEY ("coupleId") REFERENCES "Couple"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntimacyEvent"
ADD CONSTRAINT "IntimacyEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "IntimacyEvent_coupleId_dedupeKey_key"
ON "IntimacyEvent"("coupleId", "dedupeKey");

CREATE INDEX "IntimacyEvent_coupleId_createdAt_id_idx"
ON "IntimacyEvent"("coupleId", "createdAt", "id" DESC);

CREATE INDEX "IntimacyEvent_userId_createdAt_id_idx"
ON "IntimacyEvent"("userId", "createdAt", "id" DESC);

