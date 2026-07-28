import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarMovimientoFondoEnTransaccionRepository } from "@/modules/fondos/movimientos-fondo.repository";
import { generarSecuenciaDocumentalRepository } from "@/modules/secuencias/secuencias.repository";
import type {
  PrestamoPersonaRegistrado,
  RegistrarPrestamoPersonaRepositoryInput,
} from "./prestamos.types";

export class RegistrarPrestamoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrarPrestamoError";
  }
}

export async function registrarPrestamoPersonaRepository(
  input: RegistrarPrestamoPersonaRepositoryInput,
): Promise<PrestamoPersonaRegistrado> {
  return prisma.$transaction(
    async (tx) => {
      const proyecto = await tx.proyectos_base.findFirst({
        where: {
          id: input.proyecto_base_id,
          activo: true,
          fondo: { is: { activo: true } },
        },
        select: {
          id: true,
          nombre: true,
          fondo: { select: { id: true } },
        },
      });
      const acreedor = await tx.beneficiarios_pago.findFirst({
        where: {
          id: input.acreedor_id,
          activo: true,
        },
        select: {
          id: true,
          nombre: true,
          tipo_documento: true,
          numero_documento: true,
        },
      });

      if (!proyecto?.fondo) {
        throw new RegistrarPrestamoError(
          "El proyecto no existe, está inactivo o no tiene un fondo activo.",
        );
      }

      if (
        !acreedor?.tipo_documento ||
        !acreedor.numero_documento
      ) {
        throw new RegistrarPrestamoError(
          "El acreedor no existe, está inactivo o no tiene identificación.",
        );
      }

      const secuencia = await generarSecuenciaDocumentalRepository(
        {
          tipo_secuencia: "PRESTAMO_PROYECTO",
          proyecto_base_id: proyecto.id,
          centro_costo_id: null,
          proyecto_referencia: proyecto.nombre,
          centro_costo_referencia: null,
          clave_contexto: `PROYECTO:${proyecto.id}`,
          prefijo: "PRE",
          anio: input.fecha_prestamo.getUTCFullYear(),
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
        select: { id: true },
      });
      const prestamo = await tx.prestamos_proyecto.create({
        data: {
          tipo_prestamo: "PERSONA_A_PROYECTO",
          proyecto_destino_id: proyecto.id,
          fondo_destino_id: proyecto.fondo.id,
          acreedor_id: acreedor.id,
          adjunto_soporte_id: soporte.id,
          referencia_sistema: secuencia.referencia,
          acreedor_nombre: acreedor.nombre,
          acreedor_tipo_documento: acreedor.tipo_documento,
          acreedor_numero_documento: acreedor.numero_documento,
          valor_original: input.valor,
          saldo_pendiente: input.valor,
          fecha_prestamo: input.fecha_prestamo,
          estado: "ACTIVO",
          observacion: input.observacion,
          registrado_por: input.usuario_id,
          registrado_en: input.registrado_en,
        },
        select: { id: true },
      });
      const movimiento =
        await registrarMovimientoFondoEnTransaccionRepository(tx, {
          fondo_id: proyecto.fondo.id,
          proyecto_base_id: proyecto.id,
          prestamo_proyecto_id: prestamo.id,
          tipo_movimiento: "INGRESO_PRESTAMO_PERSONA",
          direccion: "INGRESO",
          valor: input.valor,
          referencia_sistema: secuencia.referencia,
          descripcion:
            input.observacion ??
            `Préstamo entregado por ${acreedor.nombre}.`,
          registrado_por: input.usuario_id,
          registrado_en: input.registrado_en,
        });

      return {
        id: prestamo.id,
        referencia_sistema: secuencia.referencia,
        proyecto_base_id: proyecto.id,
        proyecto_nombre: proyecto.nombre,
        acreedor_id: acreedor.id,
        acreedor_nombre: acreedor.nombre,
        valor_original: input.valor,
        saldo_pendiente: input.valor,
        saldo_anterior_fondo: movimiento.saldo_anterior,
        saldo_nuevo_fondo: movimiento.saldo_nuevo,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
