-- CreateTable
CREATE TABLE "dashboard_catalog_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeWidgetIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_catalog_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_catalog_configs_tenantId_userId_key" ON "dashboard_catalog_configs"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "dashboard_catalog_configs_tenantId_idx" ON "dashboard_catalog_configs"("tenantId");
