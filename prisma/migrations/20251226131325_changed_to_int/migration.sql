/*
  Warnings:

  - You are about to alter the column `maxiumEarningReturn` on the `settings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `settings` MODIFY `maxiumEarningReturn` INTEGER NULL;
