-- CreateTable
CREATE TABLE "proyectos_base" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado_proyecto" TEXT NOT NULL DEFAULT 'EN_LICITACION',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_por" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_costo" (
    "id" TEXT NOT NULL,
    "proyecto_base_id" TEXT NOT NULL,
    "linea_negocio" TEXT NOT NULL,
    "fase_centro_costo" TEXT NOT NULL,
    "prefijo" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado_centro_costo" TEXT NOT NULL DEFAULT 'EN_LICITACION',
    "creado_como_adjudicado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_creacion_adjudicada" TEXT,
    "fecha_adjudicacion" TIMESTAMP(3),
    "soporte_adjudicacion_adjunto_id" TEXT,
    "observacion_adjudicacion" TEXT,
    "adjudicado_por" TEXT,
    "adjudicado_en" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_costo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fondos" (
    "id" TEXT NOT NULL,
    "proyecto_base_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "saldo_actual" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_por" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fondos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accesos_usuario_centro_costo" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "centro_costo_id" TEXT NOT NULL,
    "puede_crear_solicitudes" BOOLEAN NOT NULL DEFAULT true,
    "puede_ver_solicitudes" BOOLEAN NOT NULL DEFAULT true,
    "puede_gestionar_fondos" BOOLEAN NOT NULL DEFAULT false,
    "puede_ver_saldo" BOOLEAN NOT NULL DEFAULT false,
    "puede_exportar" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "asignado_por" TEXT,
    "asignado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocado_por" TEXT,
    "revocado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accesos_usuario_centro_costo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proyectos_base_nombre_idx" ON "proyectos_base"("nombre");

-- CreateIndex
CREATE INDEX "proyectos_base_estado_proyecto_idx" ON "proyectos_base"("estado_proyecto");

-- CreateIndex
CREATE INDEX "proyectos_base_activo_idx" ON "proyectos_base"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "centros_costo_codigo_key" ON "centros_costo"("codigo");

-- CreateIndex
CREATE INDEX "centros_costo_proyecto_base_id_idx" ON "centros_costo"("proyecto_base_id");

-- CreateIndex
CREATE INDEX "centros_costo_codigo_idx" ON "centros_costo"("codigo");

-- CreateIndex
CREATE INDEX "centros_costo_linea_negocio_idx" ON "centros_costo"("linea_negocio");

-- CreateIndex
CREATE INDEX "centros_costo_fase_centro_costo_idx" ON "centros_costo"("fase_centro_costo");

-- CreateIndex
CREATE INDEX "centros_costo_estado_centro_costo_idx" ON "centros_costo"("estado_centro_costo");

-- CreateIndex
CREATE INDEX "centros_costo_activo_idx" ON "centros_costo"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "centros_costo_proyecto_base_id_linea_negocio_fase_centro_co_key" ON "centros_costo"("proyecto_base_id", "linea_negocio", "fase_centro_costo");

-- CreateIndex
CREATE UNIQUE INDEX "fondos_proyecto_base_id_key" ON "fondos"("proyecto_base_id");

-- CreateIndex
CREATE INDEX "fondos_activo_idx" ON "fondos"("activo");

-- CreateIndex
CREATE INDEX "accesos_usuario_centro_costo_usuario_id_idx" ON "accesos_usuario_centro_costo"("usuario_id");

-- CreateIndex
CREATE INDEX "accesos_usuario_centro_costo_centro_costo_id_idx" ON "accesos_usuario_centro_costo"("centro_costo_id");

-- CreateIndex
CREATE INDEX "accesos_usuario_centro_costo_activo_idx" ON "accesos_usuario_centro_costo"("activo");

-- AddForeignKey
ALTER TABLE "proyectos_base" ADD CONSTRAINT "proyectos_base_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centros_costo" ADD CONSTRAINT "centros_costo_proyecto_base_id_fkey" FOREIGN KEY ("proyecto_base_id") REFERENCES "proyectos_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centros_costo" ADD CONSTRAINT "centros_costo_adjudicado_por_fkey" FOREIGN KEY ("adjudicado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fondos" ADD CONSTRAINT "fondos_proyecto_base_id_fkey" FOREIGN KEY ("proyecto_base_id") REFERENCES "proyectos_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fondos" ADD CONSTRAINT "fondos_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_usuario_centro_costo" ADD CONSTRAINT "accesos_usuario_centro_costo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_usuario_centro_costo" ADD CONSTRAINT "accesos_usuario_centro_costo_centro_costo_id_fkey" FOREIGN KEY ("centro_costo_id") REFERENCES "centros_costo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_usuario_centro_costo" ADD CONSTRAINT "accesos_usuario_centro_costo_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_usuario_centro_costo" ADD CONSTRAINT "accesos_usuario_centro_costo_revocado_por_fkey" FOREIGN KEY ("revocado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
