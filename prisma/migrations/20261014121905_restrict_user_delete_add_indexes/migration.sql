-- DropForeignKey
ALTER TABLE "Panel" DROP CONSTRAINT "Panel_createdById_fkey";

-- CreateIndex
CREATE INDEX "Candidate_addedById_idx" ON "Candidate"("addedById");

-- CreateIndex
CREATE INDEX "Panel_createdById_idx" ON "Panel"("createdById");

-- AddForeignKey
ALTER TABLE "Panel" ADD CONSTRAINT "Panel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
