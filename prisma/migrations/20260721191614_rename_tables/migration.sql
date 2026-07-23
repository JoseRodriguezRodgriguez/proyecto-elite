/*
  Warnings:

  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Machinery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScheduledJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Supply` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkedJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ScheduledJob" DROP CONSTRAINT "ScheduledJob_clientId_fkey";

-- DropForeignKey
ALTER TABLE "WorkedJob" DROP CONSTRAINT "WorkedJob_clientId_fkey";

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "Employee";

-- DropTable
DROP TABLE "Machinery";

-- DropTable
DROP TABLE "ScheduledJob";

-- DropTable
DROP TABLE "Supply";

-- DropTable
DROP TABLE "WorkedJob";

-- CreateTable
CREATE TABLE "client" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "address" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "classification" VARCHAR NOT NULL DEFAULT 'verde',
    "notes" VARCHAR,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "role" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machinery" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR NOT NULL,
    "description" VARCHAR NOT NULL,
    "brand" VARCHAR NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "machinery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_job" (
    "id" SERIAL NOT NULL,
    "service" VARCHAR NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hour" VARCHAR NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "scheduled_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worked_job" (
    "id" SERIAL NOT NULL,
    "service" VARCHAR NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'Completed',
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "worked_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_user_key" ON "employee"("user");

-- AddForeignKey
ALTER TABLE "scheduled_job" ADD CONSTRAINT "scheduled_job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worked_job" ADD CONSTRAINT "worked_job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
