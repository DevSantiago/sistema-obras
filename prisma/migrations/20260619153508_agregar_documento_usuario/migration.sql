/*
  Warnings:

  - A unique constraint covering the columns `[numero_documento]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numero_documento` to the `usuarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_documento` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "numero_documento" TEXT NOT NULL,
ADD COLUMN     "tipo_documento" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numero_documento_key" ON "usuarios"("numero_documento");
