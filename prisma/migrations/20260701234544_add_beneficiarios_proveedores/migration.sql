-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "numero_documento" TEXT,
    "correo" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "banco" TEXT,
    "tipo_cuenta_bancaria" TEXT,
    "numero_cuenta_bancaria" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiarios_pago" (
    "id" TEXT NOT NULL,
    "tipo_beneficiario" TEXT NOT NULL,
    "proveedor_id" TEXT,
    "usuario_id" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo_documento" TEXT,
    "numero_documento" TEXT,
    "medio_pago_preferido" TEXT,
    "banco" TEXT,
    "tipo_cuenta_bancaria" TEXT,
    "numero_cuenta_bancaria" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiarios_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proveedores_numero_documento_idx" ON "proveedores"("numero_documento");

-- CreateIndex
CREATE INDEX "proveedores_nombre_idx" ON "proveedores"("nombre");

-- CreateIndex
CREATE INDEX "proveedores_activo_idx" ON "proveedores"("activo");

-- CreateIndex
CREATE INDEX "beneficiarios_pago_tipo_beneficiario_idx" ON "beneficiarios_pago"("tipo_beneficiario");

-- CreateIndex
CREATE INDEX "beneficiarios_pago_usuario_id_idx" ON "beneficiarios_pago"("usuario_id");

-- CreateIndex
CREATE INDEX "beneficiarios_pago_proveedor_id_idx" ON "beneficiarios_pago"("proveedor_id");

-- CreateIndex
CREATE INDEX "beneficiarios_pago_tipo_documento_numero_documento_idx" ON "beneficiarios_pago"("tipo_documento", "numero_documento");

-- CreateIndex
CREATE INDEX "beneficiarios_pago_medio_pago_preferido_idx" ON "beneficiarios_pago"("medio_pago_preferido");

-- CreateIndex
CREATE INDEX "beneficiarios_pago_activo_idx" ON "beneficiarios_pago"("activo");

-- AddForeignKey
ALTER TABLE "beneficiarios_pago" ADD CONSTRAINT "beneficiarios_pago_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiarios_pago" ADD CONSTRAINT "beneficiarios_pago_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
