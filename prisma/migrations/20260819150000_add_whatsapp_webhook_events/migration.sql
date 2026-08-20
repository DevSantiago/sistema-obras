ALTER TABLE "notificaciones_whatsapp"
ADD COLUMN "bsuid_destinatario" VARCHAR(255);

CREATE TABLE "eventos_webhook_whatsapp" (
    "id" TEXT NOT NULL,
    "clave_evento" VARCHAR(255) NOT NULL,
    "notificacion_id" TEXT,
    "meta_mensaje_id" VARCHAR(255),
    "tipo_evento" VARCHAR(50) NOT NULL,
    "estado_meta" VARCHAR(30),
    "telefono_destinatario" TEXT,
    "bsuid_destinatario" VARCHAR(255),
    "resultado" VARCHAR(30) NOT NULL,
    "error" TEXT,
    "payload" JSONB NOT NULL,
    "recibido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procesado_en" TIMESTAMP(3),

    CONSTRAINT "eventos_webhook_whatsapp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "eventos_webhook_whatsapp_clave_evento_key"
ON "eventos_webhook_whatsapp"("clave_evento");

CREATE INDEX "eventos_webhook_whatsapp_notificacion_id_recibido_en_idx"
ON "eventos_webhook_whatsapp"("notificacion_id", "recibido_en");

CREATE INDEX "eventos_webhook_whatsapp_meta_mensaje_id_idx"
ON "eventos_webhook_whatsapp"("meta_mensaje_id");

CREATE INDEX "eventos_webhook_whatsapp_tipo_evento_recibido_en_idx"
ON "eventos_webhook_whatsapp"("tipo_evento", "recibido_en");

ALTER TABLE "eventos_webhook_whatsapp"
ADD CONSTRAINT "eventos_webhook_whatsapp_notificacion_id_fkey"
FOREIGN KEY ("notificacion_id") REFERENCES "notificaciones_whatsapp"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
