/*
  Warnings:

  - Added the required column `name` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "merchant" VARCHAR(255),
ADD COLUMN     "name" VARCHAR(255) NOT NULL;
