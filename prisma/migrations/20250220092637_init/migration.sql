-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "address" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "role" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machinery" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR NOT NULL,
    "description" VARCHAR NOT NULL,
    "brand" VARCHAR NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "Machinery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJob" (
    "id" SERIAL NOT NULL,
    "service" VARCHAR NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hour" VARCHAR NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "ScheduledJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkedJob" (
    "id" SERIAL NOT NULL,
    "service" VARCHAR NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'Completed',
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "WorkedJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduledJob" ADD CONSTRAINT "ScheduledJob_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkedJob" ADD CONSTRAINT "WorkedJob_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
