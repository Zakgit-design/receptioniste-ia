-- AlterTable
ALTER TABLE "appels" ADD COLUMN     "etablissement_id" TEXT;

-- CreateIndex
CREATE INDEX "appels_etablissement_id_idx" ON "appels"("etablissement_id");

-- AddForeignKey
ALTER TABLE "appels" ADD CONSTRAINT "appels_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
