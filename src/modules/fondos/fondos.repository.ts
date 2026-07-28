import { prisma } from "@/lib/prisma";
import type { VisibilidadFondos } from "./fondos.types";

export async function consultarFondosRepository(
  visibilidad: VisibilidadFondos,
) {
  let filtrosAcceso:
    | Array<{
        proyecto_base_id: string;
        linea_negocio: string;
      }>
    | undefined;

  if (visibilidad.tipo === "ACCESOS") {
    filtrosAcceso = await prisma.accesos_usuario_proyecto.findMany({
      where: {
        usuario_id: visibilidad.usuario_id,
        activo: true,
      },
      select: {
        proyecto_base_id: true,
        linea_negocio: true,
      },
    });

    if (filtrosAcceso.length === 0) {
      return [];
    }
  }

  const proyectosIds = filtrosAcceso
    ? Array.from(
        new Set(
          filtrosAcceso.map((acceso) => acceso.proyecto_base_id),
        ),
      )
    : undefined;

  return prisma.proyectos_base.findMany({
    where: {
      activo: true,
      ...(proyectosIds ? { id: { in: proyectosIds } } : {}),
    },
    select: {
      id: true,
      nombre: true,
      estado_proyecto: true,
      fondo: {
        select: {
          id: true,
          nombre: true,
          saldo_actual: true,
        },
      },
      centros_costo: {
        where: {
          activo: true,
          ...(filtrosAcceso
            ? {
                OR: filtrosAcceso.map((acceso) => ({
                  proyecto_base_id: acceso.proyecto_base_id,
                  linea_negocio: acceso.linea_negocio,
                })),
              }
            : {}),
        },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          linea_negocio: true,
          fase_centro_costo: true,
          estado_centro_costo: true,
          movimientosFondos: {
            where: {
              direccion: "EGRESO",
            },
            select: {
              tipo_movimiento: true,
              valor: true,
            },
          },
          solicitudes_pago: {
            where: {
              detalleOperacionEfectivo: {
                isNot: null,
              },
            },
            select: {
              detalleOperacionEfectivo: {
                select: {
                  valor_pagado: true,
                },
              },
            },
          },
        },
        orderBy: [
          { linea_negocio: "asc" },
          { fase_centro_costo: "asc" },
        ],
      },
    },
    orderBy: {
      nombre: "asc",
    },
  });
}
