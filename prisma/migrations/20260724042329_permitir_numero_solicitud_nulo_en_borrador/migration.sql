/*
  Warnings:

  - You are about to alter the column `numero_solicitud` on the `solicitudes_pago` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "solicitudes_pago" ALTER COLUMN "numero_solicitud" SET DATA TYPE VARCHAR(100);
