-- CreateTable
CREATE TABLE "solicitudes_pago" (
    "id" TEXT NOT NULL,
    "numero_solicitud" TEXT NOT NULL,
    "tipo_solicitud" TEXT NOT NULL DEFAULT 'PAGO_PROVEEDOR',
    "modalidad_nomina" TEXT,
    "proyecto_base_id" TEXT NOT NULL,
    "fondo_id" TEXT NOT NULL,
    "centro_costo_id" TEXT NOT NULL,
    "beneficiario_id" TEXT,
    "proveedor_id" TEXT,
    "categoria_gasto" TEXT,
    "categoria_reembolso" TEXT,
    "concepto_nomina" TEXT,
    "medio_pago" TEXT,
    "adjunto_archivo_origen_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "valor_bruto" DECIMAL(14,2) NOT NULL,
    "valor_impuestos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_retenciones" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_descuentos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_neto" DECIMAL(14,2) NOT NULL,
    "valor_pagado" DECIMAL(14,2),
    "valor_reservado" DECIMAL(14,2),
    "estado_actual" TEXT NOT NULL DEFAULT 'BORRADOR',
    "creado_por" TEXT,
    "aprobado_1_por" TEXT,
    "aprobado_2_por" TEXT,
    "pagado_por" TEXT,
    "enviado_en" TIMESTAMP(3),
    "aprobado_1_en" TIMESTAMP(3),
    "aprobado_2_en" TIMESTAMP(3),
    "devuelto_aprobador_1_en" TIMESTAMP(3),
    "devuelto_solicitante_en" TIMESTAMP(3),
    "pagado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_pago_numero_solicitud_key" ON "solicitudes_pago"("numero_solicitud");

-- CreateIndex
CREATE INDEX "solicitudes_pago_numero_solicitud_idx" ON "solicitudes_pago"("numero_solicitud");

-- CreateIndex
CREATE INDEX "solicitudes_pago_proyecto_base_id_idx" ON "solicitudes_pago"("proyecto_base_id");

-- CreateIndex
CREATE INDEX "solicitudes_pago_fondo_id_idx" ON "solicitudes_pago"("fondo_id");

-- CreateIndex
CREATE INDEX "solicitudes_pago_centro_costo_id_idx" ON "solicitudes_pago"("centro_costo_id");

-- CreateIndex
CREATE INDEX "solicitudes_pago_beneficiario_id_idx" ON "solicitudes_pago"("beneficiario_id");

-- CreateIndex
CREATE INDEX "solicitudes_pago_proveedor_id_idx" ON "solicitudes_pago"("proveedor_id");

-- CreateIndex
CREATE INDEX "solicitudes_pago_tipo_solicitud_idx" ON "solicitudes_pago"("tipo_solicitud");

-- CreateIndex
CREATE INDEX "solicitudes_pago_estado_actual_idx" ON "solicitudes_pago"("estado_actual");

-- CreateIndex
CREATE INDEX "solicitudes_pago_medio_pago_idx" ON "solicitudes_pago"("medio_pago");

-- CreateIndex
CREATE INDEX "solicitudes_pago_categoria_gasto_idx" ON "solicitudes_pago"("categoria_gasto");

-- CreateIndex
CREATE INDEX "solicitudes_pago_categoria_reembolso_idx" ON "solicitudes_pago"("categoria_reembolso");

-- CreateIndex
CREATE INDEX "solicitudes_pago_concepto_nomina_idx" ON "solicitudes_pago"("concepto_nomina");

-- CreateIndex
CREATE INDEX "solicitudes_pago_creado_por_idx" ON "solicitudes_pago"("creado_por");

-- CreateIndex
CREATE INDEX "solicitudes_pago_pagado_por_idx" ON "solicitudes_pago"("pagado_por");

-- CreateIndex
CREATE INDEX "solicitudes_pago_creado_en_idx" ON "solicitudes_pago"("creado_en");

-- CreateIndex
CREATE INDEX "solicitudes_pago_pagado_en_idx" ON "solicitudes_pago"("pagado_en");

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_proyecto_base_id_fkey" FOREIGN KEY ("proyecto_base_id") REFERENCES "proyectos_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_fondo_id_fkey" FOREIGN KEY ("fondo_id") REFERENCES "fondos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_centro_costo_id_fkey" FOREIGN KEY ("centro_costo_id") REFERENCES "centros_costo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_beneficiario_id_fkey" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_aprobado_1_por_fkey" FOREIGN KEY ("aprobado_1_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_aprobado_2_por_fkey" FOREIGN KEY ("aprobado_2_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_pagado_por_fkey" FOREIGN KEY ("pagado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
