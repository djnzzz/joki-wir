/*
  Warnings:

  - Added the required column `updatedAt` to the `chat_rooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chat_rooms" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
