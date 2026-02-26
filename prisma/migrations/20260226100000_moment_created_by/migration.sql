-- Add createdBy to Moment (backfill existing rows with couple creatorId)

ALTER TABLE "Moment" ADD COLUMN "createdBy" VARCHAR(32);

UPDATE "Moment" AS m
SET "createdBy" = c."creatorId"
FROM "Couple" AS c
WHERE m."coupleId" = c."id"
  AND m."createdBy" IS NULL;

ALTER TABLE "Moment" ALTER COLUMN "createdBy" SET NOT NULL;

ALTER TABLE "Moment"
ADD CONSTRAINT "Moment_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Moment_createdBy_idx" ON "Moment"("createdBy");

