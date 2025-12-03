-- DropIndex
DROP INDEX `settings_email_key` ON `settings`;

-- AlterTable
ALTER TABLE `settings` ADD COLUMN `activeUser` VARCHAR(191) NULL,
    ADD COLUMN `totalUser` VARCHAR(191) NULL,
    MODIFY `phoneNumber` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;
