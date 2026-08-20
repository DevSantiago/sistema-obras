-- AlterTable
ALTER TABLE "solicitudes_pago" ADD COLUMN     "periodo_impuesto" VARCHAR(7),
ADD COLUMN     "tipo_impuesto" TEXT;

-- CreateIndex
CREATE INDEX "solicitudes_pago_tipo_impuesto_idx" ON "solicitudes_pago"("tipo_impuesto");

-- CreateIndex
CREATE INDEX "solicitudes_pago_periodo_impuesto_idx" ON "solicitudes_pago"("periodo_impuesto");
