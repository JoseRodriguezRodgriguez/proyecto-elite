/*
  Warnings:

  - A unique constraint covering the columns `[user]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "user" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_user_key" ON "Employee"("user");
