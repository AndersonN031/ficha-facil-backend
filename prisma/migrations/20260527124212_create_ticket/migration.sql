-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "queueEntryId" TEXT NOT NULL,
    "doctorId" TEXT,
    "healthUnitId" TEXT NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_queueEntryId_key" ON "tickets"("queueEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_healthUnitId_ticketNumber_createdAt_key" ON "tickets"("healthUnitId", "ticketNumber", "createdAt");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_queueEntryId_fkey" FOREIGN KEY ("queueEntryId") REFERENCES "queue_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_healthUnitId_fkey" FOREIGN KEY ("healthUnitId") REFERENCES "health_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
