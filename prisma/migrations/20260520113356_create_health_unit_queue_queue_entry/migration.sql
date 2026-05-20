-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('OPEN', 'CLOSED', 'FULL');

-- CreateEnum
CREATE TYPE "QueueEntryStatus" AS ENUM ('WAITING', 'CALLED', 'DONE', 'CANCELLED');

-- CreateTable
CREATE TABLE "health_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "cnes" TEXT,
    "maxTicketsDay" INTEGER NOT NULL DEFAULT 20,
    "openTime" TEXT NOT NULL DEFAULT '07:00',
    "closeTime" TEXT NOT NULL DEFAULT '11:00',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queues" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'OPEN',
    "ticketCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "healthUnitId" TEXT NOT NULL,

    CONSTRAINT "queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "QueueEntryStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "queueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "health_units_cnes_key" ON "health_units"("cnes");

-- CreateIndex
CREATE UNIQUE INDEX "queues_healthUnitId_date_key" ON "queues"("healthUnitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_queueId_userId_key" ON "queue_entries"("queueId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_queueId_position_key" ON "queue_entries"("queueId", "position");

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_healthUnitId_fkey" FOREIGN KEY ("healthUnitId") REFERENCES "health_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "queues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
