/*
  Warnings:

  - A unique constraint covering the columns `[duiNit]` on the table `client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "client" ADD COLUMN     "duiNit" VARCHAR(20);

-- AlterTable
ALTER TABLE "employee" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "client_duiNit_key" ON "client"("duiNit");
