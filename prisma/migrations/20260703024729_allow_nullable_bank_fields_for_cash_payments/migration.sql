-- AlterTable
ALTER TABLE "proveedores" ALTER COLUMN "banco" DROP NOT NULL,
ALTER COLUMN "tipo_cuenta_bancaria" DROP NOT NULL,
ALTER COLUMN "numero_cuenta_bancaria" DROP NOT NULL;
