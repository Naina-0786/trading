/*
  Warnings:

  - You are about to drop the column `createdBy` on the `notification` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Notification_createdBy_idx` ON `notification`;

-- AlterTable
ALTER TABLE `notification` DROP COLUMN `createdBy`;
