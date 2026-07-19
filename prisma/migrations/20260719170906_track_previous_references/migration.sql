-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "previousMonnifyReferences" TEXT[] DEFAULT ARRAY[]::TEXT[];
