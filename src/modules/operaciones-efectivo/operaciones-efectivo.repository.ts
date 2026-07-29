import { prisma } from "@/lib/prisma";
import type { FiltrosOperacionesEfectivo } from "./operaciones-efectivo.types";

export async function consultarOperacionesEfectivoRepository(
  filtros: FiltrosOperacionesEfectivo,
) {
  return prisma.operaciones_efectivo.findMany({
    where: {
      ...(filtros.proyecto_base_id
        ? { proyecto_base_id: filtros.proyecto_base_id }
        : {}),
      ...(filtros.fondo_id ? { fondo_id: filtros.fondo_id } : {}),
      ...(filtros.fecha_desde || filtros.fecha_hasta
        ? {
            fecha_retiro: {
              ...(filtros.fecha_desde
                ? {
                    gte: new Date(
                      `${filtros.fecha_desde}T00:00:00.000-05:00`,
                    ),
                  }
                : {}),
              ...(filtros.fecha_hasta
                ? {
                    lte: new Date(
                      `${filtros.fecha_hasta}T23:59:59.999-05:00`,
                    ),
                  }
                : {}),
            },
          }
        : {}),
    },
    select: {
      id: true,
      fecha_retiro: true,
      valor_requerido: true,
      valor_retirado: true,
      valor_pagado: true,
      valor_sobrante: true,
      observacion: true,
      registrado_en: true,
      proyecto_base: {
        select: { id: true, nombre: true },
      },
      fondo: {
        select: { id: true, nombre: true },
      },
      registrador: {
        select: { nombre: true },
      },
      soporte_retiro: {
        select: {
          id: true,
          nombre_archivo: true,
          tipo_mime: true,
        },
      },
      movimientos: {
        where: {
          tipo_movimiento: "INGRESO_REINTEGRO_EFECTIVO",
        },
        select: { valor: true },
      },
      detalles: {
        orderBy: { creado_en: "asc" },
        select: {
          id: true,
          medio_pago: true,
          valor_pagado: true,
          numero_comprobante: true,
          observacion: true,
          solicitud_pago: {
            select: {
              id: true,
              numero_solicitud: true,
              tipo_solicitud: true,
              beneficiario: {
                select: { nombre: true },
              },
              centro_costo: {
                select: {
                  codigo: true,
                  nombre: true,
                },
              },
            },
          },
          soporte: {
            select: {
              id: true,
              nombre_archivo: true,
              tipo_mime: true,
            },
          },
        },
      },
    },
    orderBy: [{ fecha_retiro: "desc" }, { id: "desc" }],
  });
}

export async function obtenerArchivoOperacionEfectivoRepository(
  operacionId: string,
  adjuntoId: string,
) {
  return prisma.adjuntos.findFirst({
    where: {
      id: adjuntoId,
      OR: [
        {
          soportes_retiro: {
            some: { id: operacionId },
          },
        },
        {
          soportes_detalle_efectivo: {
            some: { operacion_efectivo_id: operacionId },
          },
        },
      ],
    },
    select: {
      nombre_archivo: true,
      ruta_archivo: true,
      tipo_mime: true,
    },
  });
}
