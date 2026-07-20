/*
  Warnings:

  - Added the required column `tipo_documento` to the `proveedores` table without a default value. This is not possible if the table is not empty.
  - Made the column `numero_documento` on table `proveedores` required. This step will fail if there are existing NULL values in that column.
  - Made the column `banco` on table `proveedores` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tipo_cuenta_bancaria` on table `proveedores` required. This step will fail if there are existing NULL values in that column.
  - Made the column `numero_cuenta_bancaria` on table `proveedores` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "proveedores" ADD COLUMN     "tipo_documento" TEXT NOT NULL,
ALTER COLUMN "numero_documento" SET NOT NULL,
ALTER COLUMN "banco" SET NOT NULL,
ALTER COLUMN "tipo_cuenta_bancaria" SET NOT NULL,
ALTER COLUMN "numero_cuenta_bancaria" SET NOT NULL;

-- CreateIndex
CREATE INDEX "proveedores_tipo_documento_numero_documento_idx" ON "proveedores"("tipo_documento", "numero_documento");
