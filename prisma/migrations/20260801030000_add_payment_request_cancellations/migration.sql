CREATE TABLE "anulaciones_solicitud_pago" (
    "id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT NOT NULL,
    "estado_origen" TEXT NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "anulado_por" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anulaciones_solicitud_pago_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "anulaciones_solicitud_pago_solicitud_pago_id_creado_en_idx"
ON "anulaciones_solicitud_pago"("solicitud_pago_id", "creado_en");

CREATE INDEX "anulaciones_solicitud_pago_anulado_por_idx"
ON "anulaciones_solicitud_pago"("anulado_por");

ALTER TABLE "anulaciones_solicitud_pago"
ADD CONSTRAINT "anulaciones_solicitud_pago_solicitud_pago_id_fkey"
FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "anulaciones_solicitud_pago"
ADD CONSTRAINT "anulaciones_solicitud_pago_anulado_por_fkey"
FOREIGN KEY ("anulado_por") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
