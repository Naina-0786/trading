/*
  Warnings:

  - Added the required column `transactionId` to the `Investment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `investment` ADD COLUMN `transactionId` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED') NOT NULL DEFAULT 'ACTIVE';
