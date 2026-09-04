-- AlterTable
ALTER TABLE "users" ADD COLUMN     "healthUnitId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_healthUnitId_fkey" FOREIGN KEY ("healthUnitId") REFERENCES "health_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
