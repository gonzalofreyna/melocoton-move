-- CreateEnum
CREATE TYPE "ShippingType" AS ENUM ('standard', 'custom');

-- CreateEnum
CREATE TYPE "QuoteQuantityType" AS ENUM ('capacity', 'fixed', 'halfCapacity', 'quarterCapacity');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "gallery" TEXT[],
    "fullPrice" DECIMAL(12,2) NOT NULL,
    "discountPrice" DECIMAL(12,2),
    "colors" TEXT[],
    "category" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "studioTypes" TEXT[],
    "quoteQuantityType" "QuoteQuantityType",
    "quoteFixedQuantity" INTEGER,
    "quoteNote" TEXT,
    "quoteRecommended" BOOLEAN NOT NULL DEFAULT false,
    "freeShipping" BOOLEAN NOT NULL DEFAULT false,
    "shippingType" "ShippingType" NOT NULL DEFAULT 'standard',
    "stock" INTEGER,
    "maxQty" INTEGER,
    "weightGrams" DECIMAL(12,2),
    "widthCm" DECIMAL(10,2),
    "heightCm" DECIMAL(10,2),
    "lengthCm" DECIMAL(10,2),
    "shippingMinBusinessDays" INTEGER,
    "shippingMaxBusinessDays" INTEGER,
    "brand" TEXT,
    "sku" TEXT,
    "materials" TEXT[],
    "care" TEXT[],
    "highlights" TEXT[],
    "whatsIncluded" TEXT[],
    "returnDays" INTEGER,
    "warrantyMonths" INTEGER,
    "tags" TEXT[],
    "related" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "Product_active_idx" ON "Product"("active");
