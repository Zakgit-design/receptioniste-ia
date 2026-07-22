-- AlterEnum
ALTER TYPE "statut_entreprise" ADD VALUE 'brouillon';

-- AlterTable
ALTER TABLE "entreprises" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "fuseau_horaire" TEXT NOT NULL DEFAULT 'Europe/Zurich',
ADD COLUMN     "langue" TEXT NOT NULL DEFAULT 'fr';

-- AlterTable
ALTER TABLE "etablissements" ADD COLUMN     "jours_fermeture" TEXT[] DEFAULT ARRAY[]::TEXT[];
