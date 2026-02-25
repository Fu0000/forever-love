-- CreateEnum
CREATE TYPE "PairRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- CreateTable
CREATE TABLE "PairRequest" (
    "id" VARCHAR(32) NOT NULL,
    "coupleId" VARCHAR(32) NOT NULL,
    "fromUserId" VARCHAR(32) NOT NULL,
    "toUserId" VARCHAR(32) NOT NULL,
    "status" "PairRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "PairRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PairRequest_coupleId_idx" ON "PairRequest"("coupleId");

-- CreateIndex
CREATE INDEX "PairRequest_toUserId_status_createdAt_id_idx" ON "PairRequest"("toUserId", "status", "createdAt", "id" DESC);

-- CreateIndex
CREATE INDEX "PairRequest_fromUserId_status_createdAt_id_idx" ON "PairRequest"("fromUserId", "status", "createdAt", "id" DESC);

-- AddForeignKey
ALTER TABLE "PairRequest" ADD CONSTRAINT "PairRequest_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairRequest" ADD CONSTRAINT "PairRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairRequest" ADD CONSTRAINT "PairRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

