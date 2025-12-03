-- AlterTable
ALTER TABLE `subscriptionplan` ADD COLUMN `roiPerDay` DECIMAL(18, 6) NULL,
    MODIFY `roiPerMonth` DECIMAL(18, 6) NULL;
