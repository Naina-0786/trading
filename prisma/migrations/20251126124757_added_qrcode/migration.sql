/*
  Warnings:

  - You are about to alter the column `qrCodeUrl` on the `qrcode` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `qrcode` MODIFY `qrCodeUrl` JSON NULL,
    MODIFY `wallentaddress` VARCHAR(191) NULL;
