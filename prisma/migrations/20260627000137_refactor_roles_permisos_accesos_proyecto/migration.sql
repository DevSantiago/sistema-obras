/*
  Warnings:

  - You are about to drop the `accesos_usuario_centro_costo` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[usuario_id]` on the table `usuarios_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "accesos_usuario_centro_costo" DROP CONSTRAINT "accesos_usuario_centro_costo_asignado_por_fkey";

-- DropForeignKey
ALTER TABLE "accesos_usuario_centro_costo" DROP CONSTRAINT "accesos_usuario_centro_costo_centro_costo_id_fkey";

-- DropForeignKey
ALTER TABLE "accesos_usuario_centro_costo" DROP CONSTRAINT "accesos_usuario_centro_costo_revocado_por_fkey";

-- DropForeignKey
ALTER TABLE "accesos_usuario_centro_costo" DROP CONSTRAINT "accesos_usuario_centro_costo_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "usuarios_roles" DROP CONSTRAINT "usuarios_roles_usuario_id_fkey";

-- DropIndex
DROP INDEX "usuarios_roles_usuario_id_rol_id_key";

-- DropTable
DROP TABLE "accesos_usuario_centro_costo";

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "id" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "permiso_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_lineas_negocio" (
    "id" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "linea_negocio" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_lineas_negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accesos_usuario_proyecto" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "proyecto_base_id" TEXT NOT NULL,
    "linea_negocio" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "asignado_por" TEXT,
    "asignado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocado_por" TEXT,
    "revocado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accesos_usuario_proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE INDEX "roles_permisos_rol_id_idx" ON "roles_permisos"("rol_id");

-- CreateIndex
CREATE INDEX "roles_permisos_permiso_id_idx" ON "roles_permisos"("permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_permisos_rol_id_permiso_id_key" ON "roles_permisos"("rol_id", "permiso_id");

-- CreateIndex
CREATE INDEX "roles_lineas_negocio_rol_id_idx" ON "roles_lineas_negocio"("rol_id");

-- CreateIndex
CREATE INDEX "roles_lineas_negocio_linea_negocio_idx" ON "roles_lineas_negocio"("linea_negocio");

-- CreateIndex
CREATE UNIQUE INDEX "roles_lineas_negocio_rol_id_linea_negocio_key" ON "roles_lineas_negocio"("rol_id", "linea_negocio");

-- CreateIndex
CREATE INDEX "accesos_usuario_proyecto_usuario_id_idx" ON "accesos_usuario_proyecto"("usuario_id");

-- CreateIndex
CREATE INDEX "accesos_usuario_proyecto_proyecto_base_id_idx" ON "accesos_usuario_proyecto"("proyecto_base_id");

-- CreateIndex
CREATE INDEX "accesos_usuario_proyecto_linea_negocio_idx" ON "accesos_usuario_proyecto"("linea_negocio");

-- CreateIndex
CREATE INDEX "accesos_usuario_proyecto_activo_idx" ON "accesos_usuario_proyecto"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "accesos_usuario_proyecto_usuario_id_proyecto_base_id_linea__key" ON "accesos_usuario_proyecto"("usuario_id", "proyecto_base_id", "linea_negocio");

-- CreateIndex
CREATE INDEX "usuarios_roles_rol_id_idx" ON "usuarios_roles"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_roles_usuario_id_key" ON "usuarios_roles"("usuario_id");

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_lineas_negocio" ADD CONSTRAINT "roles_lineas_negocio_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_usuario_proyecto" ADD CONSTRAINT "accesos_usuario_proyecto_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_usuario_proyecto" ADD CONSTRAINT "accesos_usuario_proyecto_proyecto_base_id_fkey" FOREIGN KEY ("proyecto_base_id") REFERENCES "proyectos_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_usuario_proyecto" ADD CONSTRAINT "accesos_usuario_proyecto_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_usuario_proyecto" ADD CONSTRAINT "accesos_usuario_proyecto_revocado_por_fkey" FOREIGN KEY ("revocado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
