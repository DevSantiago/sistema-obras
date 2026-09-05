CREATE TABLE "suscripciones_push" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "ambiente" VARCHAR(30) NOT NULL,
    "endpoint" TEXT NOT NULL,
    "endpoint_hash" VARCHAR(64) NOT NULL,
    "clave_p256dh" TEXT NOT NULL,
    "clave_auth" TEXT NOT NULL,
    "agente_usuario" VARCHAR(500),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "revocado_en" TIMESTAMP(3),

    CONSTRAINT "suscripciones_push_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "suscripciones_push_endpoint_hash_ambiente_key"
ON "suscripciones_push"("endpoint_hash", "ambiente");

CREATE INDEX "suscripciones_push_usuario_id_ambiente_estado_idx"
ON "suscripciones_push"("usuario_id", "ambiente", "estado");

ALTER TABLE "suscripciones_push"
ADD CONSTRAINT "suscripciones_push_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
