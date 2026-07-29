import { prisma } from "@/lib/prisma";
import type {
  FiltrosMovimientosFondo,
  VisibilidadFondos,
} from "./fondos.types";

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

export async function consultarMovimientosFondoRepository(
  visibilidad: VisibilidadFondos,
  filtros: FiltrosMovimientosFondo,
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

  return prisma.movimientos_fondo.findMany({
    where: {
      ...(filtros.proyecto_base_id
        ? { proyecto_base_id: filtros.proyecto_base_id }
        : {}),
      ...(filtros.centro_costo_id
        ? { centro_costo_id: filtros.centro_costo_id }
        : {}),
      ...(filtros.linea_negocio || filtros.fase_centro_costo
        ? {
            centro_costo: {
              ...(filtros.linea_negocio
                ? { linea_negocio: filtros.linea_negocio }
                : {}),
              ...(filtros.fase_centro_costo
                ? {
                    fase_centro_costo:
                      filtros.fase_centro_costo,
                  }
                : {}),
            },
          }
        : {}),
      ...(filtros.direccion
        ? { direccion: filtros.direccion }
        : {}),
      ...(filtros.tipo_movimiento
        ? { tipo_movimiento: filtros.tipo_movimiento }
        : {}),
      ...(filtrosAcceso
        ? {
            OR: filtrosAcceso.map((acceso) => ({
              proyecto_base_id: acceso.proyecto_base_id,
              centro_costo: {
                linea_negocio: acceso.linea_negocio,
              },
            })),
          }
        : {}),
    },
    select: {
      id: true,
      tipo_movimiento: true,
      direccion: true,
      valor: true,
      saldo_anterior: true,
      saldo_nuevo: true,
      referencia_sistema: true,
      descripcion: true,
      operacion_efectivo_id: true,
      registrado_en: true,
      proyecto_base: {
        select: {
          id: true,
          nombre: true,
        },
      },
      centro_costo: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          linea_negocio: true,
          fase_centro_costo: true,
        },
      },
    },
    orderBy: [
      { registrado_en: "desc" },
      { id: "desc" },
    ],
  });
}
