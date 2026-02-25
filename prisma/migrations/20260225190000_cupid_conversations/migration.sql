-- CreateTable
CREATE TABLE "CupidConversation" (
    "id" VARCHAR(32) NOT NULL,
    "userId" VARCHAR(32) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CupidConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CupidMessage" (
    "id" VARCHAR(32) NOT NULL,
    "conversationId" VARCHAR(32) NOT NULL,
    "seq" INTEGER NOT NULL,
    "role" VARCHAR(16) NOT NULL,
    "text" TEXT NOT NULL,
    "timestampMs" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CupidMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CupidConversation_userId_updatedAt_id_idx" ON "CupidConversation"("userId", "updatedAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CupidMessage_conversationId_seq_key" ON "CupidMessage"("conversationId", "seq");

-- CreateIndex
CREATE INDEX "CupidMessage_conversationId_seq_idx" ON "CupidMessage"("conversationId", "seq");

-- AddForeignKey
ALTER TABLE "CupidConversation" ADD CONSTRAINT "CupidConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CupidMessage" ADD CONSTRAINT "CupidMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CupidConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

