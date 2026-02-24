-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(32) NOT NULL,
    "clientUserId" VARCHAR(64),
    "name" VARCHAR(64) NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Couple" (
    "id" VARCHAR(32) NOT NULL,
    "pairCode" VARCHAR(6) NOT NULL,
    "creatorId" VARCHAR(32) NOT NULL,
    "partnerId" VARCHAR(32),
    "anniversaryDate" DATE,
    "intimacyScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" VARCHAR(32) NOT NULL,
    "coupleId" VARCHAR(32) NOT NULL,
    "authorId" VARCHAR(32) NOT NULL,
    "content" TEXT NOT NULL,
    "color" VARCHAR(32),
    "mediaUrl" TEXT,
    "mediaType" VARCHAR(16),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" VARCHAR(32) NOT NULL,
    "coupleId" VARCHAR(32) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" VARCHAR(32),

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moment" (
    "id" VARCHAR(32) NOT NULL,
    "coupleId" VARCHAR(32) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clientUserId_key" ON "User"("clientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_pairCode_key" ON "Couple"("pairCode");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_creatorId_key" ON "Couple"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_partnerId_key" ON "Couple"("partnerId");

-- CreateIndex
CREATE INDEX "Couple_pairCode_idx" ON "Couple"("pairCode");

-- CreateIndex
CREATE INDEX "Note_coupleId_createdAt_id_idx" ON "Note"("coupleId", "createdAt", "id" DESC);

-- CreateIndex
CREATE INDEX "Note_authorId_idx" ON "Note"("authorId");

-- CreateIndex
CREATE INDEX "Quest_coupleId_status_createdAt_id_idx" ON "Quest"("coupleId", "status", "createdAt", "id" DESC);

-- CreateIndex
CREATE INDEX "Moment_coupleId_createdAt_id_idx" ON "Moment"("coupleId", "createdAt", "id" DESC);

-- CreateIndex
CREATE INDEX "Moment_tags_idx" ON "Moment" USING GIN ("tags");

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

