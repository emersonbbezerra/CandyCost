/*
  Warnings:

  - Added the required column `salePrice` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yield` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yieldUnit` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "salePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "yield" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "yieldUnit" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."work_configuration" ADD COLUMN     "autoCalculateMargins" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "businessName" TEXT NOT NULL DEFAULT 'Minha Confeitaria',
ADD COLUMN     "defaultMarginPercentage" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
ADD COLUMN     "enableCostAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enablePriceAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priceIncreaseAlertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 20.0;
