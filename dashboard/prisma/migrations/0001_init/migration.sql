-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "statut_entreprise" AS ENUM ('essai', 'actif', 'suspendu', 'resilie');

-- CreateEnum
CREATE TYPE "role_utilisateur" AS ENUM ('admin_plateforme', 'proprietaire', 'employe');

-- CreateEnum
CREATE TYPE "statut_agent_ia" AS ENUM ('actif', 'inactif');

-- CreateEnum
CREATE TYPE "statut_rendez_vous" AS ENUM ('confirme', 'annule', 'termine', 'absent');

-- CreateEnum
CREATE TYPE "statut_appel" AS ENUM ('termine', 'echoue', 'transfere');

-- CreateEnum
CREATE TYPE "statut_integration" AS ENUM ('connecte', 'deconnecte', 'erreur');

-- CreateEnum
CREATE TYPE "statut_abonnement" AS ENUM ('actif', 'impaye', 'resilie');

-- CreateEnum
CREATE TYPE "statut_facture" AS ENUM ('payee', 'en_attente', 'echouee');

-- CreateEnum
CREATE TYPE "service_plateforme" AS ENUM ('render', 'twilio', 'vapi', 'anthropic', 'google_calendar', 'base_de_donnees', 'webhooks');

-- CreateEnum
CREATE TYPE "statut_sante" AS ENUM ('ok', 'degrade', 'echec');

-- CreateEnum
CREATE TYPE "type_action_requise" AS ENUM ('technique', 'business', 'securite');

-- CreateEnum
CREATE TYPE "gravite_action_requise" AS ENUM ('critique', 'a_surveiller');

-- CreateEnum
CREATE TYPE "statut_action_requise" AS ENUM ('nouveau', 'traite', 'ignore', 'resolu_automatiquement');

-- CreateTable
CREATE TABLE "entreprises" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "statut" "statut_entreprise" NOT NULL DEFAULT 'essai',
    "email_contact" TEXT,
    "telephone_contact" TEXT,
    "clerk_organization_id" TEXT,
    "plan_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entreprises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etablissements" (
    "id" TEXT NOT NULL,
    "entreprise_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "fuseau_horaire" TEXT NOT NULL,
    "google_calendar_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etablissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "role_utilisateur" NOT NULL,
    "entreprise_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents_ia" (
    "id" TEXT NOT NULL,
    "entreprise_id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "vapi_assistant_id" TEXT,
    "numero_twilio" TEXT,
    "statut" "statut_agent_ia" NOT NULL DEFAULT 'actif',
    "config_voix" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agents_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "entreprise_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "duree_minutes" INTEGER NOT NULL,
    "prix" DECIMAL(10,2) NOT NULL,
    "description" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilites" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "jour_semaine" INTEGER NOT NULL,
    "heure_debut" TIME NOT NULL,
    "heure_fin" TIME NOT NULL,

    CONSTRAINT "disponibilites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendez_vous" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "client_final_id" TEXT NOT NULL,
    "google_calendar_event_id" TEXT,
    "debut" TIMESTAMP(3) NOT NULL,
    "duree_minutes" INTEGER NOT NULL,
    "statut" "statut_rendez_vous" NOT NULL DEFAULT 'confirme',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients_finaux" (
    "id" TEXT NOT NULL,
    "entreprise_id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "nom" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_finaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appels" (
    "id" TEXT NOT NULL,
    "agent_ia_id" TEXT NOT NULL,
    "vapi_call_id" TEXT,
    "telephone_appelant" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "duree_secondes" INTEGER,
    "statut" "statut_appel" NOT NULL,
    "cout_detail" JSONB,
    "url_enregistrement" TEXT,
    "rendez_vous_id" TEXT,
    "sms_envoye" BOOLEAN NOT NULL DEFAULT false,
    "outils_utilises" JSONB,
    "erreurs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "appel_id" TEXT NOT NULL,
    "transcript" JSONB,
    "resume" TEXT,
    "structured_outputs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "entreprise_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "statut" "statut_integration" NOT NULL DEFAULT 'connecte',
    "connected_at" TIMESTAMP(3),

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonnements" (
    "id" TEXT NOT NULL,
    "entreprise_id" TEXT NOT NULL,
    "nom_plan" TEXT NOT NULL,
    "prix" DECIMAL(10,2) NOT NULL,
    "cycle_facturation" TEXT NOT NULL,
    "statut" "statut_abonnement" NOT NULL DEFAULT 'actif',
    "stripe_subscription_id" TEXT,
    "fin_periode_courante" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" TEXT NOT NULL,
    "abonnement_id" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "statut" "statut_facture" NOT NULL DEFAULT 'en_attente',
    "emise_le" TIMESTAMP(3) NOT NULL,
    "payee_le" TIMESTAMP(3),
    "stripe_invoice_id" TEXT,

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT,
    "entreprise_id" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lu_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements_sante" (
    "id" TEXT NOT NULL,
    "service" "service_plateforme" NOT NULL,
    "entreprise_id" TEXT,
    "statut" "statut_sante" NOT NULL,
    "latence_ms" INTEGER,
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_sante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions_requises" (
    "id" TEXT NOT NULL,
    "type" "type_action_requise" NOT NULL,
    "gravite" "gravite_action_requise" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entreprise_id" TEXT,
    "action_recommandee" JSONB,
    "statut" "statut_action_requise" NOT NULL DEFAULT 'nouveau',
    "resolu_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actions_requises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couts_fixes_plateforme" (
    "id" TEXT NOT NULL,
    "fournisseur" TEXT NOT NULL,
    "montant_mensuel" DECIMAL(10,2) NOT NULL,
    "devise" TEXT NOT NULL,
    "actif_depuis" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couts_fixes_plateforme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entreprises_clerk_organization_id_key" ON "entreprises"("clerk_organization_id");

-- CreateIndex
CREATE INDEX "etablissements_entreprise_id_idx" ON "etablissements"("entreprise_id");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_clerk_user_id_key" ON "utilisateurs"("clerk_user_id");

-- CreateIndex
CREATE INDEX "utilisateurs_entreprise_id_idx" ON "utilisateurs"("entreprise_id");

-- CreateIndex
CREATE INDEX "agents_ia_entreprise_id_idx" ON "agents_ia"("entreprise_id");

-- CreateIndex
CREATE INDEX "agents_ia_etablissement_id_idx" ON "agents_ia"("etablissement_id");

-- CreateIndex
CREATE INDEX "services_entreprise_id_idx" ON "services"("entreprise_id");

-- CreateIndex
CREATE INDEX "disponibilites_etablissement_id_idx" ON "disponibilites"("etablissement_id");

-- CreateIndex
CREATE INDEX "rendez_vous_etablissement_id_idx" ON "rendez_vous"("etablissement_id");

-- CreateIndex
CREATE INDEX "rendez_vous_service_id_idx" ON "rendez_vous"("service_id");

-- CreateIndex
CREATE INDEX "rendez_vous_client_final_id_idx" ON "rendez_vous"("client_final_id");

-- CreateIndex
CREATE INDEX "clients_finaux_entreprise_id_idx" ON "clients_finaux"("entreprise_id");

-- CreateIndex
CREATE UNIQUE INDEX "appels_vapi_call_id_key" ON "appels"("vapi_call_id");

-- CreateIndex
CREATE INDEX "appels_agent_ia_id_idx" ON "appels"("agent_ia_id");

-- CreateIndex
CREATE INDEX "appels_rendez_vous_id_idx" ON "appels"("rendez_vous_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_appel_id_key" ON "conversations"("appel_id");

-- CreateIndex
CREATE INDEX "integrations_entreprise_id_idx" ON "integrations"("entreprise_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_entreprise_id_key" ON "abonnements"("entreprise_id");

-- CreateIndex
CREATE INDEX "factures_abonnement_id_idx" ON "factures"("abonnement_id");

-- CreateIndex
CREATE INDEX "notifications_utilisateur_id_idx" ON "notifications"("utilisateur_id");

-- CreateIndex
CREATE INDEX "notifications_entreprise_id_idx" ON "notifications"("entreprise_id");

-- CreateIndex
CREATE INDEX "evenements_sante_entreprise_id_idx" ON "evenements_sante"("entreprise_id");

-- CreateIndex
CREATE INDEX "evenements_sante_service_idx" ON "evenements_sante"("service");

-- CreateIndex
CREATE INDEX "actions_requises_entreprise_id_idx" ON "actions_requises"("entreprise_id");

-- CreateIndex
CREATE INDEX "actions_requises_statut_idx" ON "actions_requises"("statut");

-- AddForeignKey
ALTER TABLE "etablissements" ADD CONSTRAINT "etablissements_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents_ia" ADD CONSTRAINT "agents_ia_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents_ia" ADD CONSTRAINT "agents_ia_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilites" ADD CONSTRAINT "disponibilites_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_client_final_id_fkey" FOREIGN KEY ("client_final_id") REFERENCES "clients_finaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_finaux" ADD CONSTRAINT "clients_finaux_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appels" ADD CONSTRAINT "appels_agent_ia_id_fkey" FOREIGN KEY ("agent_ia_id") REFERENCES "agents_ia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appels" ADD CONSTRAINT "appels_rendez_vous_id_fkey" FOREIGN KEY ("rendez_vous_id") REFERENCES "rendez_vous"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_appel_id_fkey" FOREIGN KEY ("appel_id") REFERENCES "appels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements" ADD CONSTRAINT "abonnements_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_abonnement_id_fkey" FOREIGN KEY ("abonnement_id") REFERENCES "abonnements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements_sante" ADD CONSTRAINT "evenements_sante_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions_requises" ADD CONSTRAINT "actions_requises_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
