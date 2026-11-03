CREATE TABLE "devoluciones_solicitud_pago_adjuntos" (
    "devolucion_solicitud_pago_id" TEXT NOT NULL,
    "adjunto_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_solicitud_pago_adjuntos_pkey"
        PRIMARY KEY ("devolucion_solicitud_pago_id", "adjunto_id")
);

CREATE INDEX "devoluciones_solicitud_pago_adjuntos_adjunto_id_idx"
    ON "devoluciones_solicitud_pago_adjuntos"("adjunto_id");

ALTER TABLE "devoluciones_solicitud_pago_adjuntos"
    ADD CONSTRAINT "devoluciones_solicitud_pago_adjuntos_devolucion_fkey"
    FOREIGN KEY ("devolucion_solicitud_pago_id")
    REFERENCES "devoluciones_solicitud_pago"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "devoluciones_solicitud_pago_adjuntos"
    ADD CONSTRAINT "devoluciones_solicitud_pago_adjuntos_adjunto_fkey"
    FOREIGN KEY ("adjunto_id")
    REFERENCES "adjuntos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
