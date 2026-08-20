CREATE TABLE "anticipos" (
    "id" TEXT NOT NULL,
    "proyecto_base_id" TEXT NOT NULL,
    "fondo_id" TEXT NOT NULL,
    "adjunto_soporte_id" TEXT NOT NULL,
    "referencia_sistema" VARCHAR(150) NOT NULL,
    "entidad_nombre" VARCHAR(200) NOT NULL,
    "entidad_tipo_documento" VARCHAR(30) NOT NULL,
    "entidad_numero_documento" VARCHAR(50) NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "fecha_anticipo" TIMESTAMP(3) NOT NULL,
    "observacion" TEXT,
    "registrado_por" TEXT NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anticipos_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "movimientos_fondo"
ADD COLUMN "anticipo_id" TEXT;

CREATE UNIQUE INDEX "anticipos_adjunto_soporte_id_key"
ON "anticipos"("adjunto_soporte_id");
CREATE UNIQUE INDEX "anticipos_referencia_sistema_key"
ON "anticipos"("referencia_sistema");
CREATE INDEX "anticipos_proyecto_base_id_idx"
ON "anticipos"("proyecto_base_id");
CREATE INDEX "anticipos_fondo_id_idx" ON "anticipos"("fondo_id");
CREATE INDEX "anticipos_fecha_anticipo_idx" ON "anticipos"("fecha_anticipo");
CREATE INDEX "anticipos_entidad_numero_documento_idx"
ON "anticipos"("entidad_numero_documento");
CREATE INDEX "anticipos_registrado_por_idx"
ON "anticipos"("registrado_por");
CREATE UNIQUE INDEX "movimientos_fondo_anticipo_id_key"
ON "movimientos_fondo"("anticipo_id");

ALTER TABLE "anticipos"
ADD CONSTRAINT "anticipos_proyecto_base_id_fkey"
FOREIGN KEY ("proyecto_base_id") REFERENCES "proyectos_base"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "anticipos"
ADD CONSTRAINT "anticipos_fondo_id_fkey"
FOREIGN KEY ("fondo_id") REFERENCES "fondos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "anticipos"
ADD CONSTRAINT "anticipos_adjunto_soporte_id_fkey"
FOREIGN KEY ("adjunto_soporte_id") REFERENCES "adjuntos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "anticipos"
ADD CONSTRAINT "anticipos_registrado_por_fkey"
FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo"
ADD CONSTRAINT "movimientos_fondo_anticipo_id_fkey"
FOREIGN KEY ("anticipo_id") REFERENCES "anticipos"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
