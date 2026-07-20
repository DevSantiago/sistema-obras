-- CreateTable
CREATE TABLE "adjuntos" (
    "id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "nombre_bucket" VARCHAR(150) NOT NULL,
    "tipo_mime" VARCHAR(100),
    "tamano_archivo" BIGINT,
    "subido_por" TEXT,
    "subido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_ocr" VARCHAR(50) NOT NULL DEFAULT 'NO_PROCESADO',
    "texto_ocr" TEXT,
    "json_ocr" JSONB,

    CONSTRAINT "adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_nomina_solicitud" (
    "id" TEXT NOT NULL,
    "solicitud_pago_id" TEXT NOT NULL,
    "numero_fila" INTEGER NOT NULL,
    "beneficiario_id" TEXT,
    "tipo_documento" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "nombre_trabajador" TEXT NOT NULL,
    "concepto_nomina" TEXT NOT NULL,
    "medio_pago" TEXT NOT NULL,
    "banco" TEXT,
    "tipo_cuenta_bancaria" TEXT,
    "numero_cuenta_bancaria" TEXT,
    "valor_bruto" DECIMAL(14,2) NOT NULL,
    "valor_retenciones" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_descuentos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_neto" DECIMAL(14,2) NOT NULL,
    "estado_validacion" TEXT NOT NULL DEFAULT 'VALIDO',
    "errores_validacion" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detalles_nomina_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adjuntos_solicitud_pago_id_idx" ON "adjuntos"("solicitud_pago_id");

-- CreateIndex
CREATE INDEX "adjuntos_subido_por_idx" ON "adjuntos"("subido_por");

-- CreateIndex
CREATE INDEX "adjuntos_estado_ocr_idx" ON "adjuntos"("estado_ocr");

-- CreateIndex
CREATE INDEX "adjuntos_subido_en_idx" ON "adjuntos"("subido_en");

-- CreateIndex
CREATE INDEX "detalles_nomina_solicitud_solicitud_pago_id_idx" ON "detalles_nomina_solicitud"("solicitud_pago_id");

-- CreateIndex
CREATE INDEX "detalles_nomina_solicitud_beneficiario_id_idx" ON "detalles_nomina_solicitud"("beneficiario_id");

-- CreateIndex
CREATE INDEX "detalles_nomina_solicitud_tipo_documento_numero_documento_idx" ON "detalles_nomina_solicitud"("tipo_documento", "numero_documento");

-- CreateIndex
CREATE INDEX "detalles_nomina_solicitud_estado_validacion_idx" ON "detalles_nomina_solicitud"("estado_validacion");

-- CreateIndex
CREATE UNIQUE INDEX "detalles_nomina_solicitud_solicitud_pago_id_numero_fila_key" ON "detalles_nomina_solicitud"("solicitud_pago_id", "numero_fila");

-- AddForeignKey
ALTER TABLE "solicitudes_pago" ADD CONSTRAINT "solicitudes_pago_adjunto_archivo_origen_id_fkey" FOREIGN KEY ("adjunto_archivo_origen_id") REFERENCES "adjuntos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_solicitud_pago_id_fkey" FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_subido_por_fkey" FOREIGN KEY ("subido_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_nomina_solicitud" ADD CONSTRAINT "detalles_nomina_solicitud_solicitud_pago_id_fkey" FOREIGN KEY ("solicitud_pago_id") REFERENCES "solicitudes_pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_nomina_solicitud" ADD CONSTRAINT "detalles_nomina_solicitud_beneficiario_id_fkey" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
