CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT NOT NULL,
    "adjunto_soporte_id" TEXT NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "medio_pago" TEXT NOT NULL,
    "numero_comprobante" VARCHAR(150) NOT NULL,
    "observacion" TEXT,
    "valor_pagado" DECIMAL(14,2) NOT NULL,
    "registrado_por" TEXT NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movimientos_fondo" (
    "id" TEXT NOT NULL,
    "fondo_id" TEXT NOT NULL,
    "proyecto_base_id" TEXT NOT NULL,
    "centro_costo_id" TEXT,
    "solicitud_pago_id" TEXT,
    "pago_id" TEXT,
    "tipo_movimiento" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "saldo_anterior" DECIMAL(14,2) NOT NULL,
    "saldo_nuevo" DECIMAL(14,2) NOT NULL,
    "referencia_sistema" VARCHAR(150),
    "descripcion" TEXT,
    "registrado_por" TEXT,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_fondo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pagos_solicitud_pago_id_key" ON "pagos"("solicitud_pago_id");
CREATE UNIQUE INDEX "pagos_adjunto_soporte_id_key" ON "pagos"("adjunto_soporte_id");
CREATE INDEX "pagos_fecha_pago_idx" ON "pagos"("fecha_pago");
CREATE INDEX "pagos_medio_pago_idx" ON "pagos"("medio_pago");
CREATE INDEX "pagos_numero_comprobante_idx" ON "pagos"("numero_comprobante");
CREATE INDEX "pagos_registrado_por_idx" ON "pagos"("registrado_por");
CREATE UNIQUE INDEX "movimientos_fondo_pago_id_key" ON "movimientos_fondo"("pago_id");
CREATE INDEX "movimientos_fondo_fondo_id_idx" ON "movimientos_fondo"("fondo_id");
CREATE INDEX "movimientos_fondo_proyecto_base_id_idx" ON "movimientos_fondo"("proyecto_base_id");
CREATE INDEX "movimientos_fondo_centro_costo_id_idx" ON "movimientos_fondo"("centro_costo_id");
CREATE INDEX "movimientos_fondo_solicitud_pago_id_idx" ON "movimientos_fondo"("solicitud_pago_id");
CREATE INDEX "movimientos_fondo_tipo_movimiento_idx" ON "movimientos_fondo"("tipo_movimiento");
CREATE INDEX "movimientos_fondo_direccion_idx" ON "movimientos_fondo"("direccion");
CREATE INDEX "movimientos_fondo_registrado_en_idx" ON "movimientos_fondo"("registrado_en");

ALTER TABLE "pagos" ADD CONSTRAINT "pagos_solicitud_pago_id_fkey" FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_adjunto_soporte_id_fkey" FOREIGN KEY ("adjunto_soporte_id") REFERENCES "adjuntos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo" ADD CONSTRAINT "movimientos_fondo_fondo_id_fkey" FOREIGN KEY ("fondo_id") REFERENCES "fondos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo" ADD CONSTRAINT "movimientos_fondo_proyecto_base_id_fkey" FOREIGN KEY ("proyecto_base_id") REFERENCES "proyectos_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo" ADD CONSTRAINT "movimientos_fondo_centro_costo_id_fkey" FOREIGN KEY ("centro_costo_id") REFERENCES "centros_costo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo" ADD CONSTRAINT "movimientos_fondo_solicitud_pago_id_fkey" FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo" ADD CONSTRAINT "movimientos_fondo_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pagos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "movimientos_fondo" ADD CONSTRAINT "movimientos_fondo_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
