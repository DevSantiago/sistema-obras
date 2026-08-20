CREATE TABLE "notificaciones_whatsapp" (
    "id" TEXT NOT NULL,
    "evento_transicion_id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT NOT NULL,
    "destinatario_usuario_id" TEXT,
    "destinatario_nombre" VARCHAR(150) NOT NULL,
    "telefono_destinatario" TEXT,
    "ambiente" VARCHAR(30) NOT NULL,
    "tipo_evento" VARCHAR(80) NOT NULL,
    "estado_origen" TEXT NOT NULL,
    "estado_destino" TEXT NOT NULL,
    "plantilla" VARCHAR(150),
    "idioma" VARCHAR(10) NOT NULL DEFAULT 'es_CO',
    "contenido" JSONB NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "meta_mensaje_id" VARCHAR(255),
    "ultimo_error" TEXT,
    "respuesta_proveedor" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "enviado_en" TIMESTAMP(3),
    "entregado_en" TIMESTAMP(3),
    "leido_en" TIMESTAMP(3),

    CONSTRAINT "notificaciones_whatsapp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notificaciones_whatsapp_meta_mensaje_id_key"
ON "notificaciones_whatsapp"("meta_mensaje_id");

CREATE UNIQUE INDEX "notificaciones_whatsapp_evento_solicitud_destinatario_key"
ON "notificaciones_whatsapp"("evento_transicion_id", "solicitud_pago_id", "destinatario_usuario_id");

CREATE INDEX "notificaciones_whatsapp_solicitud_pago_id_creado_en_idx"
ON "notificaciones_whatsapp"("solicitud_pago_id", "creado_en");

CREATE INDEX "notificaciones_whatsapp_destinatario_usuario_id_creado_en_idx"
ON "notificaciones_whatsapp"("destinatario_usuario_id", "creado_en");

CREATE INDEX "notificaciones_whatsapp_estado_creado_en_idx"
ON "notificaciones_whatsapp"("estado", "creado_en");

CREATE INDEX "notificaciones_whatsapp_tipo_evento_idx"
ON "notificaciones_whatsapp"("tipo_evento");

ALTER TABLE "notificaciones_whatsapp"
ADD CONSTRAINT "notificaciones_whatsapp_solicitud_pago_id_fkey"
FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notificaciones_whatsapp"
ADD CONSTRAINT "notificaciones_whatsapp_destinatario_usuario_id_fkey"
FOREIGN KEY ("destinatario_usuario_id") REFERENCES "usuarios"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
