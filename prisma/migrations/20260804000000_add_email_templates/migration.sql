-- Drop pre-existing manually-created email tables (untracked by migrations)
DROP TABLE IF EXISTS "email_logs" CASCADE;
DROP TABLE IF EXISTS "email_templates" CASCADE;
DROP TYPE IF EXISTS "EmailTemplateType" CASCADE;

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_tenantId_key_key" ON "email_templates"("tenantId", "key");

-- CreateIndex
CREATE INDEX "email_templates_tenantId_idx" ON "email_templates"("tenantId");
