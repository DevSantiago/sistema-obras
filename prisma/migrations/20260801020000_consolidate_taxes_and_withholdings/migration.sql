UPDATE "solicitudes_pago"
SET "valor_retenciones" = "valor_retenciones" + "valor_impuestos";

ALTER TABLE "solicitudes_pago"
DROP COLUMN "valor_impuestos";

ALTER TABLE "solicitudes_pago"
RENAME COLUMN "valor_retenciones" TO "valor_impuestos_retenciones";
