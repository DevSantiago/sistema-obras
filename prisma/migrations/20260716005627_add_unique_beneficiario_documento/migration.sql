/*
  Warnings:

  - A unique constraint covering the columns `[tipo_documento,numero_documento]` on the table `beneficiarios_pago` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_pago_tipo_documento_numero_documento_key" ON "beneficiarios_pago"("tipo_documento", "numero_documento");
