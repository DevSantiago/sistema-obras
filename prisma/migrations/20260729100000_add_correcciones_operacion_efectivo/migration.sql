ALTER TABLE "operaciones_efectivo"
ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'ACTIVA';

CREATE TABLE "correcciones_operacion_efectivo" (
    "id" TEXT NOT NULL,
    "operacion_efectivo_id" TEXT NOT NULL,
    "referencia_sistema" VARCHAR(150) NOT NULL,
    "tipo" TEXT NOT NULL,
    "direccion" TEXT,
    "valor" DECIMAL(14,2),
    "motivo" VARCHAR(250) NOT NULL,
    "observacion" TEXT,
    "registrado_por" TEXT NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "correcciones_operacion_efectivo_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "movimientos_fondo"
ADD COLUMN "correccion_efectivo_id" TEXT;

CREATE UNIQUE INDEX "correcciones_operacion_efectivo_referencia_sistema_key"
ON "correcciones_operacion_efectivo"("referencia_sistema");
CREATE INDEX "correcciones_operacion_efectivo_operacion_efectivo_id_idx"
ON "correcciones_operacion_efectivo"("operacion_efectivo_id");
CREATE INDEX "correcciones_operacion_efectivo_tipo_idx"
ON "correcciones_operacion_efectivo"("tipo");
CREATE INDEX "correcciones_operacion_efectivo_registrado_por_idx"
ON "correcciones_operacion_efectivo"("registrado_por");
CREATE INDEX "correcciones_operacion_efectivo_registrado_en_idx"
ON "correcciones_operacion_efectivo"("registrado_en");
CREATE UNIQUE INDEX "movimientos_fondo_correccion_efectivo_id_key"
ON "movimientos_fondo"("correccion_efectivo_id");

ALTER TABLE "correcciones_operacion_efectivo"
ADD CONSTRAINT "correcciones_operacion_efectivo_operacion_efectivo_id_fkey"
FOREIGN KEY ("operacion_efectivo_id") REFERENCES "operaciones_efectivo"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "correcciones_operacion_efectivo"
ADD CONSTRAINT "correcciones_operacion_efectivo_registrado_por_fkey"
FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo"
ADD CONSTRAINT "movimientos_fondo_correccion_efectivo_id_fkey"
FOREIGN KEY ("correccion_efectivo_id")
REFERENCES "correcciones_operacion_efectivo"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
