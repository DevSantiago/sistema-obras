import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarMovimientoFondoEnTransaccionRepository } from "@/modules/fondos/movimientos-fondo.repository";
import { generarSecuenciaDocumentalRepository } from "@/modules/secuencias/secuencias.repository";
import type {
  AnticipoRegistrado,
  RegistrarAnticipoRepositoryInput,
} from "./anticipos.types";

export class RegistrarAnticipoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrarAnticipoError";
  }
}

export async function registrarAnticipoRepository(
  input: RegistrarAnticipoRepositoryInput,
): Promise<AnticipoRegistrado> {
  return prisma.$transaction(
    async (tx) => {
      const proyecto = await tx.proyectos_base.findFirst({
        where: {
          id: input.proyecto_base_id,
          activo: true,
          fondo: {
            is: {
              activo: true,
            },
          },
        },
        select: {
          id: true,
          nombre: true,
          fondo: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!proyecto?.fondo) {
        throw new RegistrarAnticipoError(
          "El proyecto no existe, está inactivo o no tiene un fondo activo.",
        );
      }

      const secuencia = await generarSecuenciaDocumentalRepository(
        {
          tipo_secuencia: "ANTICIPO",
          proyecto_base_id: proyecto.id,
          centro_costo_id: null,
          proyecto_referencia: proyecto.nombre,
          centro_costo_referencia: null,
          clave_contexto: `PROYECTO:${proyecto.id}`,
          prefijo: "ANT",
          anio: input.fecha_anticipo.getUTCFullYear(),
        },
        tx,
      );
      const soporte = await tx.adjuntos.create({
        data: {
          nombre_archivo: input.soporte.nombre_archivo,
          nombre_bucket: input.soporte.nombre_bucket,
          ruta_archivo: input.soporte.ruta_archivo,
          tipo_mime: input.soporte.tipo_mime,
          tamano_archivo: input.soporte.tamano_archivo,
          subido_por: input.usuario_id,
          estado_ocr: "NO_PROCESADO",
        },
        select: {
          id: true,
        },
      });
      const anticipo = await tx.anticipos.create({
        data: {
          proyecto_base_id: proyecto.id,
          fondo_id: proyecto.fondo.id,
          adjunto_soporte_id: soporte.id,
          referencia_sistema: secuencia.referencia,
          entidad_nombre: input.entidad_nombre,
          entidad_tipo_documento: input.entidad_tipo_documento,
          entidad_numero_documento:
            input.entidad_numero_documento,
          valor: input.valor,
          fecha_anticipo: input.fecha_anticipo,
          observacion: input.observacion,
          registrado_por: input.usuario_id,
          registrado_en: input.registrado_en,
        },
        select: {
          id: true,
        },
      });
      const movimiento =
        await registrarMovimientoFondoEnTransaccionRepository(tx, {
          fondo_id: proyecto.fondo.id,
          proyecto_base_id: proyecto.id,
          anticipo_id: anticipo.id,
          tipo_movimiento: "INGRESO_ANTICIPO",
          direccion: "INGRESO",
          valor: input.valor,
          referencia_sistema: secuencia.referencia,
          descripcion:
            input.observacion ??
            `Anticipo entregado por ${input.entidad_nombre}.`,
          registrado_por: input.usuario_id,
          registrado_en: input.registrado_en,
        });

      return {
        id: anticipo.id,
        referencia_sistema: secuencia.referencia,
        proyecto_base_id: proyecto.id,
        proyecto_nombre: proyecto.nombre,
        entidad_nombre: input.entidad_nombre,
        valor: input.valor,
        fecha_anticipo: input.fecha_anticipo.toISOString(),
        saldo_anterior: movimiento.saldo_anterior,
        saldo_nuevo: movimiento.saldo_nuevo,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
