-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "homeCoupleId" VARCHAR(32),
ADD COLUMN     "activeCoupleId" VARCHAR(32);

-- CreateIndex
CREATE INDEX "User_homeCoupleId_idx" ON "User"("homeCoupleId");

-- CreateIndex
CREATE INDEX "User_activeCoupleId_idx" ON "User"("activeCoupleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeCoupleId_fkey" FOREIGN KEY ("homeCoupleId") REFERENCES "Couple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeCoupleId_fkey" FOREIGN KEY ("activeCoupleId") REFERENCES "Couple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

