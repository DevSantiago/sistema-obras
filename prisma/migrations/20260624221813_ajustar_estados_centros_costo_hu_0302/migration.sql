/*
  Warnings:

  - You are about to drop the column `adjudicado_en` on the `centros_costo` table. All the data in the column will be lost.
  - You are about to drop the column `adjudicado_por` on the `centros_costo` table. All the data in the column will be lost.
  - You are about to drop the column `creado_como_adjudicado` on the `centros_costo` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_adjudicacion` on the `centros_costo` table. All the data in the column will be lost.
  - You are about to drop the column `motivo_creacion_adjudicada` on the `centros_costo` table. All the data in the column will be lost.
  - You are about to drop the column `observacion_adjudicacion` on the `centros_costo` table. All the data in the column will be lost.
  - You are about to drop the column `soporte_adjudicacion_adjunto_id` on the `centros_costo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "centros_costo" DROP CONSTRAINT "centros_costo_adjudicado_por_fkey";

-- AlterTable
ALTER TABLE "centros_costo" DROP COLUMN "adjudicado_en",
DROP COLUMN "adjudicado_por",
DROP COLUMN "creado_como_adjudicado",
DROP COLUMN "fecha_adjudicacion",
DROP COLUMN "motivo_creacion_adjudicada",
DROP COLUMN "observacion_adjudicacion",
DROP COLUMN "soporte_adjudicacion_adjunto_id",
ADD COLUMN     "creado_directamente_en_ejecucion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_inicio_ejecucion" TIMESTAMP(3),
ADD COLUMN     "inicio_ejecucion_en" TIMESTAMP(3),
ADD COLUMN     "inicio_ejecucion_por" TEXT,
ADD COLUMN     "motivo_creacion_ejecucion" TEXT,
ADD COLUMN     "observacion_inicio_ejecucion" TEXT,
ADD COLUMN     "soporte_inicio_ejecucion_adjunto_id" TEXT;

-- AddForeignKey
ALTER TABLE "centros_costo" ADD CONSTRAINT "centros_costo_inicio_ejecucion_por_fkey" FOREIGN KEY ("inicio_ejecucion_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
