-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'WORK_TRANSLATION');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "UserContent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'COMPLETED',
    "pointsUsed" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserContent_userId_createdAt_idx" ON "UserContent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserContent_isPublic_createdAt_idx" ON "UserContent"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "UserContent_type_isPublic_idx" ON "UserContent"("type", "isPublic");

-- AddForeignKey
ALTER TABLE "UserContent" ADD CONSTRAINT "UserContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
