-- AlterTable
ALTER TABLE "solicitudes_pago"
ADD COLUMN "periodo_nomina" VARCHAR(7);

-- CheckConstraint
ALTER TABLE "solicitudes_pago"
ADD CONSTRAINT "restriccion_modalidad_nomina"
CHECK (
  "modalidad_nomina" IS NULL
  OR "modalidad_nomina" IN ('INDIVIDUAL', 'AGRUPADA_EXCEL')
);

-- CheckConstraint
ALTER TABLE "solicitudes_pago"
ADD CONSTRAINT "restriccion_periodo_nomina"
CHECK (
  "periodo_nomina" IS NULL
  OR "periodo_nomina" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
);

-- CreateIndex
CREATE INDEX "solicitudes_pago_periodo_nomina_idx"
ON "solicitudes_pago" ("periodo_nomina");

-- CreatePartialIndex
CREATE INDEX "indice_solicitudes_nomina_individual_duplicados"
ON "solicitudes_pago" (
  "proyecto_base_id",
  "centro_costo_id",
  "beneficiario_id",
  "concepto_nomina",
  "periodo_nomina",
  "estado_actual"
)
WHERE
  "tipo_solicitud" = 'PAGO_NOMINA'
  AND "modalidad_nomina" = 'INDIVIDUAL';