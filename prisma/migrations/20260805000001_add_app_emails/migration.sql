-- Drop the per-supplier email table added in 20260805000000 (superseded by global app emails)
DROP TABLE IF EXISTS "supplier_emails" CASCADE;

-- CreateTable
CREATE TABLE "app_emails" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_emails_tenantId_idx" ON "app_emails"("tenantId");