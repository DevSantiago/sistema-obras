CREATE TABLE "notificaciones_push" (
    "id" TEXT NOT NULL,
    "evento_transicion_id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT NOT NULL,
    "destinatario_usuario_id" TEXT NOT NULL,
    "suscripcion_push_id" TEXT NOT NULL,
    "ambiente" VARCHAR(30) NOT NULL,
    "tipo_evento" VARCHAR(80) NOT NULL,
    "estado_origen" TEXT NOT NULL,
    "estado_destino" TEXT NOT NULL,
    "titulo" VARCHAR(120) NOT NULL,
    "mensaje" VARCHAR(200) NOT NULL,
    "enlace" VARCHAR(500) NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimo_error" TEXT,
    "respuesta_proveedor" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "enviado_en" TIMESTAMP(3),

    CONSTRAINT "notificaciones_push_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notificaciones_push_evento_destino_suscripcion_key" ON "notificaciones_push"("evento_transicion_id", "solicitud_pago_id", "destinatario_usuario_id", "suscripcion_push_id");
CREATE INDEX "notificaciones_push_solicitud_pago_id_creado_en_idx" ON "notificaciones_push"("solicitud_pago_id", "creado_en");
CREATE INDEX "notificaciones_push_destinatario_usuario_id_creado_en_idx" ON "notificaciones_push"("destinatario_usuario_id", "creado_en");
CREATE INDEX "notificaciones_push_suscripcion_push_id_creado_en_idx" ON "notificaciones_push"("suscripcion_push_id", "creado_en");
CREATE INDEX "notificaciones_push_estado_creado_en_idx" ON "notificaciones_push"("estado", "creado_en");
CREATE INDEX "notificaciones_push_tipo_evento_idx" ON "notificaciones_push"("tipo_evento");

ALTER TABLE "notificaciones_push" ADD CONSTRAINT "notificaciones_push_solicitud_pago_id_fkey" FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notificaciones_push" ADD CONSTRAINT "notificaciones_push_destinatario_usuario_id_fkey" FOREIGN KEY ("destinatario_usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notificaciones_push" ADD CONSTRAINT "notificaciones_push_suscripcion_push_id_fkey" FOREIGN KEY ("suscripcion_push_id") REFERENCES "suscripciones_push"("id") ON DELETE CASCADE ON UPDATE CASCADE;
