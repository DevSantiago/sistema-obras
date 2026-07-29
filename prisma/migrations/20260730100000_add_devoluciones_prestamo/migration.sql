CREATE TABLE "devoluciones_prestamo" (
    "id" TEXT NOT NULL,
    "prestamo_proyecto_id" TEXT NOT NULL,
    "adjunto_soporte_id" TEXT NOT NULL,
    "referencia_sistema" VARCHAR(150) NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "saldo_anterior" DECIMAL(14,2) NOT NULL,
    "saldo_nuevo" DECIMAL(14,2) NOT NULL,
    "fecha_devolucion" TIMESTAMP(3) NOT NULL,
    "observacion" TEXT,
    "registrado_por" TEXT NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "devoluciones_prestamo_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "movimientos_fondo"
ADD COLUMN "devolucion_prestamo_id" TEXT;

CREATE UNIQUE INDEX "devoluciones_prestamo_adjunto_soporte_id_key"
ON "devoluciones_prestamo"("adjunto_soporte_id");
CREATE UNIQUE INDEX "devoluciones_prestamo_referencia_sistema_key"
ON "devoluciones_prestamo"("referencia_sistema");
CREATE INDEX "devoluciones_prestamo_prestamo_proyecto_id_idx"
ON "devoluciones_prestamo"("prestamo_proyecto_id");
CREATE INDEX "devoluciones_prestamo_fecha_devolucion_idx"
ON "devoluciones_prestamo"("fecha_devolucion");
CREATE INDEX "devoluciones_prestamo_registrado_por_idx"
ON "devoluciones_prestamo"("registrado_por");
CREATE INDEX "movimientos_fondo_devolucion_prestamo_id_idx"
ON "movimientos_fondo"("devolucion_prestamo_id");

ALTER TABLE "devoluciones_prestamo"
ADD CONSTRAINT "devoluciones_prestamo_prestamo_proyecto_id_fkey"
FOREIGN KEY ("prestamo_proyecto_id") REFERENCES "prestamos_proyecto"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "devoluciones_prestamo"
ADD CONSTRAINT "devoluciones_prestamo_adjunto_soporte_id_fkey"
FOREIGN KEY ("adjunto_soporte_id") REFERENCES "adjuntos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "devoluciones_prestamo"
ADD CONSTRAINT "devoluciones_prestamo_registrado_por_fkey"
FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo"
ADD CONSTRAINT "movimientos_fondo_devolucion_prestamo_id_fkey"
FOREIGN KEY ("devolucion_prestamo_id") REFERENCES "devoluciones_prestamo"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
