-- CreateTable
CREATE TABLE "prueba_conexion" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prueba_conexion_pkey" PRIMARY KEY ("id")
);
