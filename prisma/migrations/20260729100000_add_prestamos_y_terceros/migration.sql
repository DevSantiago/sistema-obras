ALTER TABLE "anticipos" ADD COLUMN "entidad_id" TEXT;

CREATE TABLE "prestamos_proyecto" (
    "id" TEXT NOT NULL,
    "tipo_prestamo" TEXT NOT NULL,
    "proyecto_destino_id" TEXT NOT NULL,
    "fondo_destino_id" TEXT NOT NULL,
    "proyecto_origen_id" TEXT,
    "fondo_origen_id" TEXT,
    "acreedor_id" TEXT,
    "adjunto_soporte_id" TEXT NOT NULL,
    "referencia_sistema" VARCHAR(150) NOT NULL,
    "acreedor_nombre" VARCHAR(200),
    "acreedor_tipo_documento" VARCHAR(30),
    "acreedor_numero_documento" VARCHAR(50),
    "valor_original" DECIMAL(14,2) NOT NULL,
    "saldo_pendiente" DECIMAL(14,2) NOT NULL,
    "fecha_prestamo" TIMESTAMP(3) NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
    "observacion" TEXT,
    "registrado_por" TEXT NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prestamos_proyecto_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "movimientos_fondo"
ADD COLUMN "prestamo_proyecto_id" TEXT;

CREATE INDEX "anticipos_entidad_id_idx" ON "anticipos"("entidad_id");
CREATE UNIQUE INDEX "prestamos_proyecto_adjunto_soporte_id_key"
ON "prestamos_proyecto"("adjunto_soporte_id");
CREATE UNIQUE INDEX "prestamos_proyecto_referencia_sistema_key"
ON "prestamos_proyecto"("referencia_sistema");
CREATE INDEX "prestamos_proyecto_proyecto_destino_id_idx"
ON "prestamos_proyecto"("proyecto_destino_id");
CREATE INDEX "prestamos_proyecto_fondo_destino_id_idx"
ON "prestamos_proyecto"("fondo_destino_id");
CREATE INDEX "prestamos_proyecto_proyecto_origen_id_idx"
ON "prestamos_proyecto"("proyecto_origen_id");
CREATE INDEX "prestamos_proyecto_fondo_origen_id_idx"
ON "prestamos_proyecto"("fondo_origen_id");
CREATE INDEX "prestamos_proyecto_acreedor_id_idx"
ON "prestamos_proyecto"("acreedor_id");
CREATE INDEX "prestamos_proyecto_fecha_prestamo_idx"
ON "prestamos_proyecto"("fecha_prestamo");
CREATE INDEX "prestamos_proyecto_estado_idx"
ON "prestamos_proyecto"("estado");
CREATE INDEX "prestamos_proyecto_registrado_por_idx"
ON "prestamos_proyecto"("registrado_por");
CREATE INDEX "movimientos_fondo_prestamo_proyecto_id_idx"
ON "movimientos_fondo"("prestamo_proyecto_id");

ALTER TABLE "anticipos"
ADD CONSTRAINT "anticipos_entidad_id_fkey"
FOREIGN KEY ("entidad_id") REFERENCES "beneficiarios_pago"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prestamos_proyecto"
ADD CONSTRAINT "prestamos_proyecto_proyecto_destino_id_fkey"
FOREIGN KEY ("proyecto_destino_id") REFERENCES "proyectos_base"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prestamos_proyecto"
ADD CONSTRAINT "prestamos_proyecto_fondo_destino_id_fkey"
FOREIGN KEY ("fondo_destino_id") REFERENCES "fondos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prestamos_proyecto"
ADD CONSTRAINT "prestamos_proyecto_proyecto_origen_id_fkey"
FOREIGN KEY ("proyecto_origen_id") REFERENCES "proyectos_base"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prestamos_proyecto"
ADD CONSTRAINT "prestamos_proyecto_fondo_origen_id_fkey"
FOREIGN KEY ("fondo_origen_id") REFERENCES "fondos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prestamos_proyecto"
ADD CONSTRAINT "prestamos_proyecto_acreedor_id_fkey"
FOREIGN KEY ("acreedor_id") REFERENCES "beneficiarios_pago"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prestamos_proyecto"
ADD CONSTRAINT "prestamos_proyecto_adjunto_soporte_id_fkey"
FOREIGN KEY ("adjunto_soporte_id") REFERENCES "adjuntos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prestamos_proyecto"
ADD CONSTRAINT "prestamos_proyecto_registrado_por_fkey"
FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo"
ADD CONSTRAINT "movimientos_fondo_prestamo_proyecto_id_fkey"
FOREIGN KEY ("prestamo_proyecto_id") REFERENCES "prestamos_proyecto"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
