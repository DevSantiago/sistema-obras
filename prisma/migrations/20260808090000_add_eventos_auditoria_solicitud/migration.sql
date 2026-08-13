CREATE TABLE "eventos_auditoria_solicitud_pago" (
    "id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT,
    "solicitud_ref_id" TEXT NOT NULL,
    "numero_solicitud" VARCHAR(100),
    "accion" VARCHAR(80) NOT NULL,
    "estado_anterior" TEXT,
    "estado_nuevo" TEXT,
    "descripcion" VARCHAR(500) NOT NULL,
    "cambios" JSONB,
    "registrado_por" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_auditoria_solicitud_pago_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "eventos_auditoria_solicitud_pago_solicitud_pago_id_creado_en_idx"
ON "eventos_auditoria_solicitud_pago"("solicitud_pago_id", "creado_en");

CREATE INDEX "eventos_auditoria_solicitud_pago_solicitud_ref_id_creado_en_idx"
ON "eventos_auditoria_solicitud_pago"("solicitud_ref_id", "creado_en");

CREATE INDEX "eventos_auditoria_solicitud_pago_registrado_por_idx"
ON "eventos_auditoria_solicitud_pago"("registrado_por");

CREATE INDEX "eventos_auditoria_solicitud_pago_accion_idx"
ON "eventos_auditoria_solicitud_pago"("accion");

ALTER TABLE "eventos_auditoria_solicitud_pago"
ADD CONSTRAINT "eventos_auditoria_solicitud_pago_solicitud_pago_id_fkey"
FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "eventos_auditoria_solicitud_pago"
ADD CONSTRAINT "eventos_auditoria_solicitud_pago_registrado_por_fkey"
FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
