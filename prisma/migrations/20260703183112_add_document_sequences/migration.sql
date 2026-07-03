-- CreateTable
CREATE TABLE "secuencias_documentales" (
    "id" TEXT NOT NULL,
    "tipo_secuencia" TEXT NOT NULL,
    "proyecto_base_id" TEXT,
    "centro_costo_id" TEXT,
    "clave_contexto" TEXT NOT NULL,
    "prefijo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "valor_actual" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secuencias_documentales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "secuencias_documentales_proyecto_base_id_idx" ON "secuencias_documentales"("proyecto_base_id");

-- CreateIndex
CREATE INDEX "secuencias_documentales_centro_costo_id_idx" ON "secuencias_documentales"("centro_costo_id");

-- CreateIndex
CREATE INDEX "secuencias_documentales_tipo_secuencia_idx" ON "secuencias_documentales"("tipo_secuencia");

-- CreateIndex
CREATE INDEX "secuencias_documentales_clave_contexto_idx" ON "secuencias_documentales"("clave_contexto");

-- CreateIndex
CREATE UNIQUE INDEX "secuencias_documentales_tipo_secuencia_clave_contexto_anio_key" ON "secuencias_documentales"("tipo_secuencia", "clave_contexto", "anio");

-- AddForeignKey
ALTER TABLE "secuencias_documentales" ADD CONSTRAINT "secuencias_documentales_proyecto_base_id_fkey" FOREIGN KEY ("proyecto_base_id") REFERENCES "proyectos_base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secuencias_documentales" ADD CONSTRAINT "secuencias_documentales_centro_costo_id_fkey" FOREIGN KEY ("centro_costo_id") REFERENCES "centros_costo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
