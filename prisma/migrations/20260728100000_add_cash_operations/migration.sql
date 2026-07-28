CREATE TABLE "operaciones_efectivo" (
    "id" TEXT NOT NULL,
    "proyecto_base_id" TEXT NOT NULL,
    "fondo_id" TEXT NOT NULL,
    "adjunto_retiro_id" TEXT NOT NULL,
    "fecha_retiro" TIMESTAMP(3) NOT NULL,
    "valor_requerido" DECIMAL(14,2) NOT NULL,
    "valor_retirado" DECIMAL(14,2) NOT NULL,
    "valor_pagado" DECIMAL(14,2) NOT NULL,
    "valor_sobrante" DECIMAL(14,2) NOT NULL,
    "sobrante_reintegrado" BOOLEAN NOT NULL DEFAULT false,
    "observacion" TEXT,
    "registrado_por" TEXT NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "operaciones_efectivo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "detalles_operacion_efectivo" (
    "id" TEXT NOT NULL,
    "operacion_efectivo_id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT NOT NULL,
    "adjunto_soporte_id" TEXT NOT NULL,
    "medio_pago" TEXT NOT NULL,
    "valor_pagado" DECIMAL(14,2) NOT NULL,
    "numero_comprobante" VARCHAR(150),
    "observacion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "detalles_operacion_efectivo_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "movimientos_fondo" ADD COLUMN "operacion_efectivo_id" TEXT;

CREATE UNIQUE INDEX "operaciones_efectivo_adjunto_retiro_id_key" ON "operaciones_efectivo"("adjunto_retiro_id");
CREATE INDEX "operaciones_efectivo_proyecto_base_id_idx" ON "operaciones_efectivo"("proyecto_base_id");
CREATE INDEX "operaciones_efectivo_fondo_id_idx" ON "operaciones_efectivo"("fondo_id");
CREATE INDEX "operaciones_efectivo_fecha_retiro_idx" ON "operaciones_efectivo"("fecha_retiro");
CREATE INDEX "operaciones_efectivo_registrado_por_idx" ON "operaciones_efectivo"("registrado_por");
CREATE UNIQUE INDEX "detalles_operacion_efectivo_solicitud_pago_id_key" ON "detalles_operacion_efectivo"("solicitud_pago_id");
CREATE UNIQUE INDEX "detalles_operacion_efectivo_adjunto_soporte_id_key" ON "detalles_operacion_efectivo"("adjunto_soporte_id");
CREATE INDEX "detalles_operacion_efectivo_operacion_efectivo_id_idx" ON "detalles_operacion_efectivo"("operacion_efectivo_id");
CREATE INDEX "detalles_operacion_efectivo_medio_pago_idx" ON "detalles_operacion_efectivo"("medio_pago");
CREATE INDEX "movimientos_fondo_operacion_efectivo_id_idx" ON "movimientos_fondo"("operacion_efectivo_id");

ALTER TABLE "operaciones_efectivo" ADD CONSTRAINT "operaciones_efectivo_proyecto_base_id_fkey" FOREIGN KEY ("proyecto_base_id") REFERENCES "proyectos_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operaciones_efectivo" ADD CONSTRAINT "operaciones_efectivo_fondo_id_fkey" FOREIGN KEY ("fondo_id") REFERENCES "fondos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operaciones_efectivo" ADD CONSTRAINT "operaciones_efectivo_adjunto_retiro_id_fkey" FOREIGN KEY ("adjunto_retiro_id") REFERENCES "adjuntos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operaciones_efectivo" ADD CONSTRAINT "operaciones_efectivo_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_operacion_efectivo" ADD CONSTRAINT "detalles_operacion_efectivo_operacion_efectivo_id_fkey" FOREIGN KEY ("operacion_efectivo_id") REFERENCES "operaciones_efectivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_operacion_efectivo" ADD CONSTRAINT "detalles_operacion_efectivo_solicitud_pago_id_fkey" FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_operacion_efectivo" ADD CONSTRAINT "detalles_operacion_efectivo_adjunto_soporte_id_fkey" FOREIGN KEY ("adjunto_soporte_id") REFERENCES "adjuntos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo" ADD CONSTRAINT "movimientos_fondo_operacion_efectivo_id_fkey" FOREIGN KEY ("operacion_efectivo_id") REFERENCES "operaciones_efectivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
