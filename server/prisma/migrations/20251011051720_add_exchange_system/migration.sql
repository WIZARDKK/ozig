/*
  Warnings:

  - You are about to drop the column `reason` on the `exchange` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `exchange` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(2))`.
  - You are about to drop the column `originalProductId` on the `exchangeitem` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Exchange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalOrderItemId` to the `ExchangeItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `newProductId` on table `exchangeitem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `exchange` DROP FOREIGN KEY `Exchange_userId_fkey`;

-- DropForeignKey
ALTER TABLE `exchangeitem` DROP FOREIGN KEY `ExchangeItem_newProductId_fkey`;

-- DropForeignKey
ALTER TABLE `exchangeitem` DROP FOREIGN KEY `ExchangeItem_originalProductId_fkey`;

-- AlterTable
ALTER TABLE `exchange` DROP COLUMN `reason`,
    ADD COLUMN `additionalPaymentRequired` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `customerName` VARCHAR(191) NULL,
    ADD COLUMN `customerPhone` VARCHAR(191) NULL,
    ADD COLUMN `exchangeDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `totalPriceDifference` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `userId` INTEGER NULL,
    MODIFY `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED';

-- AlterTable
ALTER TABLE `exchangeitem` DROP COLUMN `originalProductId`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `originalOrderItemId` INTEGER NOT NULL,
    MODIFY `newProductId` INTEGER NOT NULL,
    MODIFY `quantity` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `stock` INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `Exchange` ADD CONSTRAINT `Exchange_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExchangeItem` ADD CONSTRAINT `ExchangeItem_originalOrderItemId_fkey` FOREIGN KEY (`originalOrderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExchangeItem` ADD CONSTRAINT `ExchangeItem_newProductId_fkey` FOREIGN KEY (`newProductId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
