/*
  Warnings:

  - The values [employe] on the enum `role_utilisateur` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "role_utilisateur_new" AS ENUM ('admin_plateforme', 'proprietaire', 'administrateur', 'responsable_etablissement', 'membre');
ALTER TABLE "utilisateurs" ALTER COLUMN "role" TYPE "role_utilisateur_new" USING ("role"::text::"role_utilisateur_new");
ALTER TYPE "role_utilisateur" RENAME TO "role_utilisateur_old";
ALTER TYPE "role_utilisateur_new" RENAME TO "role_utilisateur";
DROP TYPE "public"."role_utilisateur_old";
COMMIT;

-- AlterTable
ALTER TABLE "entreprises" ADD COLUMN     "notifier_rdv_par_email" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifier_rdv_par_sms" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "assignations_etablissement" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignations_etablissement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignations_etablissement_utilisateur_id_idx" ON "assignations_etablissement"("utilisateur_id");

-- CreateIndex
CREATE INDEX "assignations_etablissement_etablissement_id_idx" ON "assignations_etablissement"("etablissement_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignations_etablissement_utilisateur_id_etablissement_id_key" ON "assignations_etablissement"("utilisateur_id", "etablissement_id");

-- AddForeignKey
ALTER TABLE "assignations_etablissement" ADD CONSTRAINT "assignations_etablissement_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignations_etablissement" ADD CONSTRAINT "assignations_etablissement_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
