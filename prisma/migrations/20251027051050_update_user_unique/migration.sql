/*
  Warnings:

  - A unique constraint covering the columns `[email,referralCode,referredById]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `User_email_referralCode_key` ON `user`;

-- CreateIndex
CREATE UNIQUE INDEX `User_email_referralCode_referredById_key` ON `User`(`email`, `referralCode`, `referredById`);
