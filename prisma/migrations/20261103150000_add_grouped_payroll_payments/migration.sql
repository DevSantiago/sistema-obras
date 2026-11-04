ALTER TABLE "movimientos_fondo"
ADD COLUMN "pago_nomina_grupal_id" TEXT;

CREATE TABLE "pagos_nomina_grupal" (
    "id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT NOT NULL,
    "detalle_nomina_id" TEXT NOT NULL,
    "adjunto_soporte_id" TEXT NOT NULL,
    "operacion_efectivo_id" TEXT,
    "medio_pago" TEXT NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "numero_comprobante" VARCHAR(150),
    "observacion" TEXT,
    "valor_pagado" DECIMAL(14,2) NOT NULL,
    "registrado_por" TEXT NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_nomina_grupal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "movimientos_fondo_pago_nomina_grupal_id_key"
ON "movimientos_fondo"("pago_nomina_grupal_id");

CREATE UNIQUE INDEX "pagos_nomina_grupal_detalle_nomina_id_key"
ON "pagos_nomina_grupal"("detalle_nomina_id");
CREATE UNIQUE INDEX "pagos_nomina_grupal_adjunto_soporte_id_key"
ON "pagos_nomina_grupal"("adjunto_soporte_id");
CREATE INDEX "pagos_nomina_grupal_solicitud_pago_id_idx"
ON "pagos_nomina_grupal"("solicitud_pago_id");
CREATE INDEX "pagos_nomina_grupal_operacion_efectivo_id_idx"
ON "pagos_nomina_grupal"("operacion_efectivo_id");
CREATE INDEX "pagos_nomina_grupal_medio_pago_idx"
ON "pagos_nomina_grupal"("medio_pago");
CREATE INDEX "pagos_nomina_grupal_fecha_pago_idx"
ON "pagos_nomina_grupal"("fecha_pago");
CREATE INDEX "pagos_nomina_grupal_registrado_por_idx"
ON "pagos_nomina_grupal"("registrado_por");

ALTER TABLE "pagos_nomina_grupal"
ADD CONSTRAINT "pagos_nomina_grupal_solicitud_pago_id_fkey"
FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pagos_nomina_grupal"
ADD CONSTRAINT "pagos_nomina_grupal_detalle_nomina_id_fkey"
FOREIGN KEY ("detalle_nomina_id") REFERENCES "detalles_nomina_solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pagos_nomina_grupal"
ADD CONSTRAINT "pagos_nomina_grupal_adjunto_soporte_id_fkey"
FOREIGN KEY ("adjunto_soporte_id") REFERENCES "adjuntos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pagos_nomina_grupal"
ADD CONSTRAINT "pagos_nomina_grupal_operacion_efectivo_id_fkey"
FOREIGN KEY ("operacion_efectivo_id") REFERENCES "operaciones_efectivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pagos_nomina_grupal"
ADD CONSTRAINT "pagos_nomina_grupal_registrado_por_fkey"
FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo"
ADD CONSTRAINT "movimientos_fondo_pago_nomina_grupal_id_fkey"
FOREIGN KEY ("pago_nomina_grupal_id") REFERENCES "pagos_nomina_grupal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
