import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CrearSolicitudPagoRepositoryInput,
  SolicitudPagoListFilters,
} from "./solicitudes-pago.types";

const solicitudPagoInclude = {
  proyecto_base: {
    select: {
      id: true,
      nombre: true,
      estado_proyecto: true,
    },
  },
  centro_costo: {
    select: {
      id: true,
      nombre: true,
      linea_negocio: true,
      fase_centro_costo: true,
      estado_centro_costo: true,
    },
  },
  beneficiario: {
    select: {
      id: true,
      nombre: true,
      tipo_beneficiario: true,
      tipo_documento: true,
      numero_documento: true,
    },
  },
  proveedor: {
    select: {
      id: true,
      nombre: true,
      tipo_documento: true,
      numero_documento: true,
    },
  },
  creador: {
    select: {
      id: true,
      nombre: true,
      correo: true,
    },
  },
};

export type AccesoUsuarioProyectoLinea = {
  proyecto_base_id: string;
  linea_negocio: string;
};

export async function obtenerProyectoBaseActivoRepository(id: string) {
  return prisma.proyectos_base.findFirst({
    where: {
      id,
      activo: true,
    },
  });
}

export async function obtenerFondoActivoPorProyectoRepository(
  proyectoBaseId: string,
) {
  return prisma.fondos.findFirst({
    where: {
      proyecto_base_id: proyectoBaseId,
      activo: true,
    },
  });
}

export async function obtenerCentroCostoActivoRepository(id: string) {
  return prisma.centros_costo.findFirst({
    where: {
      id,
      activo: true,
    },
  });
}

export async function obtenerBeneficiarioActivoRepository(id: string) {
  return prisma.beneficiarios_pago.findFirst({
    where: {
      id,
      activo: true,
    },
  });
}

export async function obtenerAccesoActivoUsuarioProyectoLineaRepository(
  usuarioId: string,
  proyectoBaseId: string,
  lineaNegocio: string,
) {
  return prisma.accesos_usuario_proyecto.findFirst({
    where: {
      usuario_id: usuarioId,
      proyecto_base_id: proyectoBaseId,
      linea_negocio: lineaNegocio,
      activo: true,
    },
  });
}

export async function listarAccesosActivosUsuarioRepository(usuarioId: string) {
  return prisma.accesos_usuario_proyecto.findMany({
    where: {
      usuario_id: usuarioId,
      activo: true,
    },
    select: {
      proyecto_base_id: true,
      linea_negocio: true,
    },
  });
}

export async function crearSolicitudPagoRepository(
  data: CrearSolicitudPagoRepositoryInput,
) {
  return prisma.solicitudes_pago.create({
    data: {
      numero_solicitud: data.numero_solicitud,
      tipo_solicitud: data.tipo_solicitud,
      proyecto_base_id: data.proyecto_base_id,
      fondo_id: data.fondo_id,
      centro_costo_id: data.centro_costo_id,
      beneficiario_id: data.beneficiario_id,
      proveedor_id: data.proveedor_id,
      categoria_gasto: data.categoria_gasto,
      medio_pago: data.medio_pago,
      descripcion: data.descripcion,
      valor_bruto: data.valor_bruto,
      valor_impuestos: data.valor_impuestos,
      valor_retenciones: data.valor_retenciones,
      valor_descuentos: data.valor_descuentos,
      valor_neto: data.valor_neto,
      estado_actual: data.estado_actual,
      creado_por: data.creado_por,
    },
  });
}

export async function listarSolicitudesPagoRepository(input: {
  filters?: SolicitudPagoListFilters;
  usuarioId: string;
  consultarTodo: boolean;
  accesos: AccesoUsuarioProyectoLinea[];
}) {
  const filtros = input.filters ?? {};

  const whereBase: Prisma.solicitudes_pagoWhereInput = {
    ...(filtros.tipo_solicitud
      ? { tipo_solicitud: filtros.tipo_solicitud }
      : {}),
    ...(filtros.estado_actual
      ? { estado_actual: filtros.estado_actual }
      : {}),
    ...(filtros.proyecto_base_id
      ? { proyecto_base_id: filtros.proyecto_base_id }
      : {}),
    ...(filtros.centro_costo_id
      ? { centro_costo_id: filtros.centro_costo_id }
      : {}),
    ...(filtros.beneficiario_id
      ? { beneficiario_id: filtros.beneficiario_id }
      : {}),
    ...(filtros.medio_pago ? { medio_pago: filtros.medio_pago } : {}),
    ...(filtros.busqueda
      ? {
          OR: [
            {
              numero_solicitud: {
                contains: filtros.busqueda,
                mode: "insensitive",
              },
            },
            {
              descripcion: {
                contains: filtros.busqueda,
                mode: "insensitive",
              },
            },
            {
              categoria_gasto: {
                contains: filtros.busqueda,
                mode: "insensitive",
              },
            },
            {
              beneficiario: {
                nombre: {
                  contains: filtros.busqueda,
                  mode: "insensitive",
                },
              },
            },
            {
              proveedor: {
                nombre: {
                  contains: filtros.busqueda,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {}),
  };

  const accesosWhere: Prisma.solicitudes_pagoWhereInput[] = input.accesos.map(
    (acceso) => ({
      proyecto_base_id: acceso.proyecto_base_id,
      centro_costo: {
        linea_negocio: acceso.linea_negocio,
      },
    }),
  );

  const where: Prisma.solicitudes_pagoWhereInput = input.consultarTodo
    ? whereBase
    : {
        AND: [
          whereBase,
          {
            OR: [
              {
                creado_por: input.usuarioId,
              },
              ...accesosWhere,
            ],
          },
        ],
      };

  return prisma.solicitudes_pago.findMany({
    where,
    include: solicitudPagoInclude,
    orderBy: {
      creado_en: "desc",
    },
  });
}