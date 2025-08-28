-- AlterTable
ALTER TABLE "UserContent" ADD COLUMN     "sourceId" TEXT;

-- CreateIndex
CREATE INDEX "UserContent_sourceId_isPublic_idx" ON "UserContent"("sourceId", "isPublic");
