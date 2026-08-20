CREATE TABLE "devoluciones_solicitud_pago" (
    "id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT NOT NULL,
    "estado_origen" TEXT NOT NULL,
    "estado_destino" TEXT NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "devuelto_por" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_solicitud_pago_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "devoluciones_solicitud_pago_solicitud_pago_id_creado_en_idx"
ON "devoluciones_solicitud_pago"("solicitud_pago_id", "creado_en");

CREATE INDEX "devoluciones_solicitud_pago_devuelto_por_idx"
ON "devoluciones_solicitud_pago"("devuelto_por");

ALTER TABLE "devoluciones_solicitud_pago"
ADD CONSTRAINT "devoluciones_solicitud_pago_solicitud_pago_id_fkey"
FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "devoluciones_solicitud_pago"
ADD CONSTRAINT "devoluciones_solicitud_pago_devuelto_por_fkey"
FOREIGN KEY ("devuelto_por") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
