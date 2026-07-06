import { randomUUID } from "crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  GenerarSecuenciaInput,
  SecuenciaGenerada,
} from "./secuencias.types";

type SecuenciaActualizada = {
  tipo_secuencia: string;
  proyecto_base_id: string | null;
  centro_costo_id: string | null;
  clave_contexto: string;
  prefijo: string;
  anio: number;
  valor_actual: number;
};

export async function generarSecuenciaDocumentalRepository(
  input: Required<
    Pick<GenerarSecuenciaInput, "tipo_secuencia" | "prefijo" | "anio">
  > &
    Pick<GenerarSecuenciaInput, "proyecto_base_id" | "centro_costo_id"> & {
      clave_contexto: string;
    },
): Promise<SecuenciaGenerada> {
  const proyectoBaseId = input.proyecto_base_id ?? null;
  const centroCostoId = input.centro_costo_id ?? null;

  const secuencias = await prisma.$queryRaw<SecuenciaActualizada[]>(
    Prisma.sql`
      INSERT INTO secuencias_documentales (
        id,
        tipo_secuencia,
        proyecto_base_id,
        centro_costo_id,
        clave_contexto,
        prefijo,
        anio,
        valor_actual,
        creado_en,
        actualizado_en
      )
      VALUES (
        ${randomUUID()},
        ${input.tipo_secuencia},
        ${proyectoBaseId},
        ${centroCostoId},
        ${input.clave_contexto},
        ${input.prefijo},
        ${input.anio},
        1,
        NOW(),
        NOW()
      )
      ON CONFLICT (tipo_secuencia, clave_contexto, anio)
      DO UPDATE SET
        valor_actual = secuencias_documentales.valor_actual + 1,
        prefijo = EXCLUDED.prefijo,
        proyecto_base_id = EXCLUDED.proyecto_base_id,
        centro_costo_id = EXCLUDED.centro_costo_id,
        actualizado_en = NOW()
      RETURNING
        tipo_secuencia,
        proyecto_base_id,
        centro_costo_id,
        clave_contexto,
        prefijo,
        anio,
        valor_actual;
    `,
  );

  const secuencia = secuencias[0];

  if (!secuencia) {
    throw new Error("No fue posible generar la secuencia documental.");
  }

  return {
    tipo_secuencia:
      secuencia.tipo_secuencia as SecuenciaGenerada["tipo_secuencia"],
    proyecto_base_id: secuencia.proyecto_base_id,
    centro_costo_id: secuencia.centro_costo_id,
    clave_contexto: secuencia.clave_contexto,
    prefijo: secuencia.prefijo,
    anio: secuencia.anio,
    valor: secuencia.valor_actual,
    referencia: `${secuencia.prefijo}-${secuencia.anio}-${String(
      secuencia.valor_actual,
    ).padStart(6, "0")}`,
  };
}