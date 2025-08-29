-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('WORK_TRANSLATION', 'TEXT_GENERATION', 'IMAGE_GENERATION', 'AUDIO_GENERATION', 'VIDEO_GENERATION');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AsyncTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsyncTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AsyncTask_status_scheduledAt_idx" ON "AsyncTask"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "AsyncTask_userId_taskType_idx" ON "AsyncTask"("userId", "taskType");
