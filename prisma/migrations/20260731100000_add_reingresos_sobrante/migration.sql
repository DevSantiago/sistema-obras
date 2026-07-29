CREATE TABLE "reingresos_sobrante_efectivo" (
    "id" TEXT NOT NULL,
    "operacion_efectivo_id" TEXT NOT NULL,
    "adjunto_soporte_id" TEXT NOT NULL,
    "referencia_sistema" VARCHAR(150) NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "pendiente_anterior" DECIMAL(14,2) NOT NULL,
    "pendiente_nuevo" DECIMAL(14,2) NOT NULL,
    "fecha_reingreso" TIMESTAMP(3) NOT NULL,
    "observacion" TEXT,
    "registrado_por" TEXT NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reingresos_sobrante_efectivo_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "movimientos_fondo"
ADD COLUMN "reingreso_sobrante_id" TEXT;

CREATE UNIQUE INDEX "reingresos_sobrante_efectivo_adjunto_soporte_id_key"
ON "reingresos_sobrante_efectivo"("adjunto_soporte_id");
CREATE UNIQUE INDEX "reingresos_sobrante_efectivo_referencia_sistema_key"
ON "reingresos_sobrante_efectivo"("referencia_sistema");
CREATE INDEX "reingresos_sobrante_efectivo_operacion_efectivo_id_idx"
ON "reingresos_sobrante_efectivo"("operacion_efectivo_id");
CREATE INDEX "reingresos_sobrante_efectivo_fecha_reingreso_idx"
ON "reingresos_sobrante_efectivo"("fecha_reingreso");
CREATE INDEX "reingresos_sobrante_efectivo_registrado_por_idx"
ON "reingresos_sobrante_efectivo"("registrado_por");
CREATE UNIQUE INDEX "movimientos_fondo_reingreso_sobrante_id_key"
ON "movimientos_fondo"("reingreso_sobrante_id");

ALTER TABLE "reingresos_sobrante_efectivo"
ADD CONSTRAINT "reingresos_sobrante_efectivo_operacion_efectivo_id_fkey"
FOREIGN KEY ("operacion_efectivo_id") REFERENCES "operaciones_efectivo"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reingresos_sobrante_efectivo"
ADD CONSTRAINT "reingresos_sobrante_efectivo_adjunto_soporte_id_fkey"
FOREIGN KEY ("adjunto_soporte_id") REFERENCES "adjuntos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reingresos_sobrante_efectivo"
ADD CONSTRAINT "reingresos_sobrante_efectivo_registrado_por_fkey"
FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo"
ADD CONSTRAINT "movimientos_fondo_reingreso_sobrante_id_fkey"
FOREIGN KEY ("reingreso_sobrante_id") REFERENCES "reingresos_sobrante_efectivo"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
