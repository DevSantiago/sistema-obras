import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  BuscarDuplicadoNominaIndividualInput,
  CrearSolicitudPagoRepositoryInput,
  SolicitudPagoListFilters,
  VisibilidadSolicitudesPago,
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
} satisfies Prisma.solicitudes_pagoInclude;

export class SolicitudesPagoCambioConcurrenteError extends Error {
  constructor() {
    super(
      "Una o más solicitudes cambiaron de estado durante la aprobación.",
    );

    this.name = "SolicitudesPagoCambioConcurrenteError";
  }
}

type SolicitudReservaNivel1 = {
  id: string;
  valor_reservado: Prisma.Decimal;
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

export async function buscarDuplicadoNominaIndividualRepository(
  input: BuscarDuplicadoNominaIndividualInput,
) {
  return prisma.solicitudes_pago.findFirst({
    where: {
      tipo_solicitud: "PAGO_NOMINA",
      modalidad_nomina: "INDIVIDUAL",
      proyecto_base_id: input.proyecto_base_id,
      centro_costo_id: input.centro_costo_id,
      beneficiario_id: input.beneficiario_id,
      concepto_nomina: {
        equals: input.concepto_nomina,
        mode: "insensitive",
      },
      periodo_nomina: input.periodo_nomina,
      estado_actual: {
        not: "ANULADA",
      },
    },
    select: {
      id: true,
      numero_solicitud: true,
      estado_actual: true,
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
      modalidad_nomina: data.modalidad_nomina,
      periodo_nomina: data.periodo_nomina,
      proyecto_base_id: data.proyecto_base_id,
      fondo_id: data.fondo_id,
      centro_costo_id: data.centro_costo_id,
      beneficiario_id: data.beneficiario_id,
      proveedor_id: data.proveedor_id,
      categoria_gasto: data.categoria_gasto,
      categoria_reembolso: data.categoria_reembolso,
      concepto_nomina: data.concepto_nomina,
      tipo_impuesto: data.tipo_impuesto,
      periodo_impuesto: data.periodo_impuesto,
      medio_pago: data.medio_pago,
      adjunto_archivo_origen_id: data.adjunto_archivo_origen_id,
      descripcion: data.descripcion,
      valor_bruto: data.valor_bruto,
      valor_impuestos: data.valor_impuestos,
      valor_retenciones: data.valor_retenciones,
      valor_descuentos: data.valor_descuentos,
      valor_neto: data.valor_neto,
      estado_actual: data.estado_actual,
      creado_por: data.creado_por,
    },
    include: solicitudPagoInclude,
  });
}

export async function listarSolicitudesPagoRepository(input: {
  filters?: SolicitudPagoListFilters;
  visibilidad: VisibilidadSolicitudesPago;
}) {
  const filtros = input.filters ?? {};

  const whereBase: Prisma.solicitudes_pagoWhereInput = {
    ...(filtros.tipo_solicitud
      ? {
          tipo_solicitud: filtros.tipo_solicitud,
        }
      : {}),
    ...(filtros.modalidad_nomina
      ? {
          modalidad_nomina: filtros.modalidad_nomina,
        }
      : {}),
    ...(filtros.periodo_nomina
      ? {
          periodo_nomina: filtros.periodo_nomina,
        }
      : {}),
    ...(filtros.tipo_impuesto
      ? {
          tipo_impuesto: filtros.tipo_impuesto,
        }
      : {}),
    ...(filtros.periodo_impuesto
      ? {
          periodo_impuesto: filtros.periodo_impuesto,
        }
      : {}),
    ...(filtros.estado_actual
      ? {
          estado_actual: filtros.estado_actual,
        }
      : {}),
    ...(filtros.proyecto_base_id
      ? {
          proyecto_base_id: filtros.proyecto_base_id,
        }
      : {}),
    ...(filtros.centro_costo_id
      ? {
          centro_costo_id: filtros.centro_costo_id,
        }
      : {}),
    ...(filtros.beneficiario_id
      ? {
          beneficiario_id: filtros.beneficiario_id,
        }
      : {}),
    ...(filtros.medio_pago
      ? {
          medio_pago: filtros.medio_pago,
        }
      : {}),
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
              categoria_reembolso: {
                contains: filtros.busqueda,
                mode: "insensitive",
              },
            },
            {
              concepto_nomina: {
                contains: filtros.busqueda,
                mode: "insensitive",
              },
            },
            {
              periodo_nomina: {
                contains: filtros.busqueda,
                mode: "insensitive",
              },
            },
            {
              tipo_impuesto: {
                contains: filtros.busqueda,
                mode: "insensitive",
              },
            },
            {
              periodo_impuesto: {
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

  const condicionesVisibilidad: Prisma.solicitudes_pagoWhereInput[] = [];

  if (input.visibilidad.incluir_propias) {
    condicionesVisibilidad.push({
      creado_por: input.visibilidad.usuario_id,
    });
  }

  if (input.visibilidad.estados_flujo.length > 0) {
    condicionesVisibilidad.push({
      estado_actual: {
        in: input.visibilidad.estados_flujo,
      },
    });
  }

  const where: Prisma.solicitudes_pagoWhereInput =
    input.visibilidad.consultar_todas
      ? whereBase
      : {
          AND: [
            whereBase,
            {
              OR: condicionesVisibilidad,
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

export async function obtenerSolicitudPagoPorIdRepository(id: string) {
  return prisma.solicitudes_pago.findUnique({
    where: {
      id,
    },
    include: solicitudPagoInclude,
  });
}

export async function enviarSolicitudPagoRepository(input: {
  solicitudId: string;
  enviadoEn: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const resultado = await tx.solicitudes_pago.updateMany({
      where: {
        id: input.solicitudId,
        estado_actual: "BORRADOR",
      },
      data: {
        estado_actual: "PENDIENTE_APROBADOR_1",
        enviado_en: input.enviadoEn,
      },
    });

    if (resultado.count === 0) {
      return null;
    }

    return tx.solicitudes_pago.findUnique({
      where: {
        id: input.solicitudId,
      },
      include: solicitudPagoInclude,
    });
  });
}

export async function obtenerSolicitudesPagoPorIdsRepository(
  solicitudIds: string[],
) {
  return prisma.solicitudes_pago.findMany({
    where: {
      id: {
        in: solicitudIds,
      },
    },
    select: {
      id: true,
      numero_solicitud: true,
      proyecto_base_id: true,
      fondo_id: true,
      valor_neto: true,
      valor_reservado: true,
      estado_actual: true,
      proyecto_base: {
        select: {
          id: true,
          nombre: true,
        },
      },
      fondo: {
        select: {
          id: true,
          proyecto_base_id: true,
          saldo_actual: true,
          activo: true,
        },
      },
    },
  });
}

export async function obtenerReservasPorFondosRepository(
  fondoIds: string[],
) {
  return prisma.solicitudes_pago.groupBy({
    by: ["fondo_id"],
    where: {
      fondo_id: {
        in: fondoIds,
      },
      valor_reservado: {
        gt: 0,
      },
    },
    _sum: {
      valor_reservado: true,
    },
  });
}

export async function obtenerFondosPorIdsRepository(
  fondoIds: string[],
) {
  return prisma.fondos.findMany({
    where: {
      id: {
        in: fondoIds,
      },
    },
    select: {
      id: true,
      proyecto_base_id: true,
      saldo_actual: true,
      activo: true,
    },
  });
}

export async function aprobarSolicitudesNivel1Repository(
  solicitudes: SolicitudReservaNivel1[],
  usuarioAprobadorId: string,
  fechaAprobacion: Date,
) {
  return prisma.$transaction(async (tx) => {
    let cantidadActualizada = 0;

    for (const solicitud of solicitudes) {
      const resultado = await tx.solicitudes_pago.updateMany({
        where: {
          id: solicitud.id,
          estado_actual: "PENDIENTE_APROBADOR_1",
          valor_reservado: null,
        },
        data: {
          estado_actual: "PENDIENTE_APROBADOR_2",
          valor_reservado: solicitud.valor_reservado,
          aprobado_1_por: usuarioAprobadorId,
          aprobado_1_en: fechaAprobacion,
          actualizado_en: fechaAprobacion,
        },
      });

      if (resultado.count !== 1) {
        throw new SolicitudesPagoCambioConcurrenteError();
      }

      cantidadActualizada += resultado.count;
    }

    return {
      count: cantidadActualizada,
    };
  });
}

export async function aprobarSolicitudesNivel2Repository(
  solicitudIds: string[],
  usuarioAprobadorId: string,
  fechaAprobacion: Date,
) {
  return prisma.$transaction(async (tx) => {
    let cantidadActualizada = 0;

    for (const solicitudId of solicitudIds) {
      const resultado = await tx.solicitudes_pago.updateMany({
        where: {
          id: solicitudId,
          estado_actual: "PENDIENTE_APROBADOR_2",
          valor_reservado: {
            not: null,
          },
        },
        data: {
          estado_actual: "PROGRAMADA_PAGO",
          aprobado_2_por: usuarioAprobadorId,
          aprobado_2_en: fechaAprobacion,
          actualizado_en: fechaAprobacion,
        },
      });

      if (resultado.count !== 1) {
        throw new SolicitudesPagoCambioConcurrenteError();
      }

      cantidadActualizada += resultado.count;
    }

    return {
      count: cantidadActualizada,
    };
  });
}

export async function eliminarSolicitudPagoRepository(
  solicitudPagoId: string,
) {
  return prisma.solicitudes_pago.delete({
    where: {
      id: solicitudPagoId,
    },
  });
}
