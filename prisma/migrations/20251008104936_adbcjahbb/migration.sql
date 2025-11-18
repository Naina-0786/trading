/*
  Warnings:

  - You are about to drop the column `number` on the `user` table. All the data in the column will be lost.
  - Added the required column `phonenumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `number`,
    ADD COLUMN `phonenumber` VARCHAR(191) NOT NULL;
