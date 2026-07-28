-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'estimator', 'pm');

-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('Pricing', 'Tendering', 'Issued', 'Won', 'Lost', 'Withdrawn');

-- CreateEnum
CREATE TYPE "Trade" AS ENUM ('Groundworks', 'Electrical', 'Plumbing', 'Roofing', 'Joinery', 'Plastering', 'Other');

-- CreateEnum
CREATE TYPE "CisStatus" AS ENUM ('Registered', 'Verified', 'Gross', 'Unregistered');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "received" TIMESTAMP(3) NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "status" "TenderStatus" NOT NULL DEFAULT 'Pricing',
    "contractSum" DECIMAL(12,2),
    "assignedEstimatorId" TEXT,
    "estimateRequestedAt" TIMESTAMP(3),
    "estimatedById" TEXT,
    "estimatedAt" TIMESTAMP(3),
    "lastReminderSentAt" TIMESTAMP(3),
    "sourceEmailId" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "trade" "Trade" NOT NULL,
    "contact" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "projectIds" TEXT[],
    "usedBefore" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "ramsUrl" TEXT,
    "ramsExpiry" TIMESTAMP(3),
    "insuranceUrl" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "cisStatus" "CisStatus" NOT NULL DEFAULT 'Unregistered',
    "cisExpiry" TIMESTAMP(3),
    "dropboxAccountId" TEXT,
    "dropboxFolderPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_documents" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "dropboxPath" TEXT NOT NULL,
    "dropboxLink" TEXT NOT NULL,
    "dropboxRev" TEXT,
    "category" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dropbox_links" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "dropboxPath" TEXT NOT NULL,
    "dropboxUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dropbox_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dropbox_tokens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountEmail" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "dropbox_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_layouts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgets" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tender_sourceEmailId_key" ON "Tender"("sourceEmailId");

-- CreateIndex
CREATE INDEX "Tender_status_idx" ON "Tender"("status");

-- CreateIndex
CREATE INDEX "Tender_due_idx" ON "Tender"("due");

-- CreateIndex
CREATE INDEX "Tender_isDeleted_idx" ON "Tender"("isDeleted");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "suppliers_tenantId_is_deleted_idx" ON "suppliers"("tenantId", "is_deleted");

-- CreateIndex
CREATE INDEX "suppliers_trade_idx" ON "suppliers"("trade");

-- CreateIndex
CREATE INDEX "suppliers_company_idx" ON "suppliers"("company");

-- CreateIndex
CREATE INDEX "supplier_documents_supplierId_idx" ON "supplier_documents"("supplierId");

-- CreateIndex
CREATE INDEX "dropbox_links_supplierId_idx" ON "dropbox_links"("supplierId");

-- CreateIndex
CREATE INDEX "dropbox_tokens_tenantId_userId_idx" ON "dropbox_tokens"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "dashboard_layouts_tenantId_idx" ON "dashboard_layouts"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_layouts_tenantId_userId_key" ON "dashboard_layouts"("tenantId", "userId");

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_assignedEstimatorId_fkey" FOREIGN KEY ("assignedEstimatorId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_documents" ADD CONSTRAINT "supplier_documents_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dropbox_links" ADD CONSTRAINT "dropbox_links_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
