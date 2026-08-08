import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MovimientoFondoError,
  registrarMovimientoFondoEnTransaccionRepository,
} from "@/modules/fondos/movimientos-fondo.repository";
import type { RegistrarMovimientoFondoInput } from "@/modules/fondos/movimientos-fondo.types";
import { generarSecuenciaDocumentalRepository } from "@/modules/secuencias/secuencias.repository";
import type {
  ActualizarSolicitudPagoRepositoryInput,
  BuscarDuplicadoNominaIndividualInput,
  CrearSolicitudPagoRepositoryInput,
  RegistrarOperacionEfectivoRepositoryInput,
  RegistrarTransferenciaRepositoryInput,
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
  devoluciones: {
    orderBy: {
      creado_en: "desc" as const,
    },
    take: 1,
    select: {
      id: true,
      estado_origen: true,
      estado_destino: true,
      motivo: true,
      creado_en: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  },
  pagos: {
    select: {
      soporte: {
        select: {
          id: true,
          nombre_archivo: true,
          tipo_mime: true,
        },
      },
    },
  },
  detalleOperacionEfectivo: {
    select: {
      soporte: {
        select: {
          id: true,
          nombre_archivo: true,
          tipo_mime: true,
        },
      },
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

export class RegistroPagosError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistroPagosError";
  }
}

async function registrarMovimientoPago(
  tx: Prisma.TransactionClient,
  input: RegistrarMovimientoFondoInput,
  mensajeSaldoInsuficiente: string,
) {
  try {
    return await registrarMovimientoFondoEnTransaccionRepository(
      tx,
      input,
    );
  } catch (error) {
    if (error instanceof MovimientoFondoError) {
      throw new RegistroPagosError(
        error.codigo === "SALDO_INSUFICIENTE"
          ? mensajeSaldoInsuficiente
          : error.message,
      );
    }

    throw error;
  }
}

type SolicitudReservaNivel1 = {
  id: string;
  valor_reservado: Prisma.Decimal;
  estado_origen: "PENDIENTE_APROBADOR_1" | "DEVUELTA_APROBADOR_1";
};

function obtenerReferenciaCentroCosto(input: {
  lineaNegocio: string;
  faseCentroCosto: string;
}): string {
  const lineaNegocio = input.lineaNegocio.trim().toUpperCase();
  const faseCentroCosto = input.faseCentroCosto.trim().toUpperCase();

  if (lineaNegocio === "OBRA" && faseCentroCosto === "LICITACION") {
    return "PRO-OBRA";
  }

  if (lineaNegocio === "OBRA" && faseCentroCosto === "EJECUCION") {
    return "OBRA";
  }

  if (
    lineaNegocio === "INTERVENTORIA" &&
    faseCentroCosto === "LICITACION"
  ) {
    return "PRO-INT";
  }

  if (
    lineaNegocio === "INTERVENTORIA" &&
    faseCentroCosto === "EJECUCION"
  ) {
    return "INT";
  }

  throw new Error(
    "La línea de negocio y la fase del centro de costo no permiten construir el consecutivo documental.",
  );
}

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

export async function obtenerAccesoActivoUsuarioProyectoRepository(
  usuarioId: string,
  proyectoBaseId: string,
) {
  return prisma.accesos_usuario_proyecto.findFirst({
    where: {
      usuario_id: usuarioId,
      proyecto_base_id: proyectoBaseId,
      activo: true,
    },
    select: { id: true },
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
      ...(input.excluir_solicitud_id
        ? {
            id: {
              not: input.excluir_solicitud_id,
            },
          }
        : {}),
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

  if (input.visibilidad.incluir_proyectos_asignados) {
    condicionesVisibilidad.push({
      proyecto_base: {
        accesos: {
          some: {
            usuario_id: input.visibilidad.usuario_id,
            activo: true,
          },
        },
      },
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

export async function obtenerComprobantePagoSolicitudRepository(id: string) {
  return prisma.adjuntos.findFirst({
    where: {
      OR: [
        { soporte_pago: { solicitud_pago_id: id } },
        {
          soportes_detalle_efectivo: {
            some: { solicitud_pago_id: id },
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

export async function actualizarSolicitudPagoRepository(
  input: ActualizarSolicitudPagoRepositoryInput,
) {
  return prisma.solicitudes_pago.update({
    where: {
      id: input.id,
    },
    data: {
      tipo_solicitud: input.data.tipo_solicitud,
      modalidad_nomina: input.data.modalidad_nomina,
      periodo_nomina: input.data.periodo_nomina,
      proyecto_base_id: input.data.proyecto_base_id,
      fondo_id: input.data.fondo_id,
      centro_costo_id: input.data.centro_costo_id,
      beneficiario_id: input.data.beneficiario_id,
      proveedor_id: input.data.proveedor_id,
      categoria_gasto: input.data.categoria_gasto,
      categoria_reembolso: input.data.categoria_reembolso,
      concepto_nomina: input.data.concepto_nomina,
      tipo_impuesto: input.data.tipo_impuesto,
      periodo_impuesto: input.data.periodo_impuesto,
      medio_pago: input.data.medio_pago,
      adjunto_archivo_origen_id:
        input.data.adjunto_archivo_origen_id,
      descripcion: input.data.descripcion,
      valor_bruto: input.data.valor_bruto,
      valor_retenciones: input.data.valor_retenciones,
      valor_descuentos: input.data.valor_descuentos,
      valor_neto: input.data.valor_neto,
    },
    include: solicitudPagoInclude,
  });
}

export async function editarSolicitudAprobadorNivel1Repository(input: {
  solicitudId: string;
  estadoOrigen: "PENDIENTE_APROBADOR_1" | "DEVUELTA_APROBADOR_1";
  beneficiarioId: string;
  proveedorId: string | null;
  categoriaGasto: string | null;
  categoriaReembolso: string | null;
  conceptoNomina: string | null;
  tipoImpuesto: string | null;
  medioPago: string;
  descripcion: string;
  valorBruto: number;
  valorRetenciones: number;
  valorDescuentos: number;
  valorNeto: number;
}) {
  return prisma.$transaction(async (tx) => {
    const resultado = await tx.solicitudes_pago.updateMany({
      where: {
        id: input.solicitudId,
        estado_actual: input.estadoOrigen,
      },
      data: {
        beneficiario_id: input.beneficiarioId,
        proveedor_id: input.proveedorId,
        categoria_gasto: input.categoriaGasto,
        categoria_reembolso: input.categoriaReembolso,
        concepto_nomina: input.conceptoNomina,
        tipo_impuesto: input.tipoImpuesto,
        medio_pago: input.medioPago,
        descripcion: input.descripcion,
        valor_bruto: input.valorBruto,
        valor_retenciones: input.valorRetenciones,
        valor_descuentos: input.valorDescuentos,
        valor_neto: input.valorNeto,
        ...(input.estadoOrigen === "DEVUELTA_APROBADOR_1"
          ? { valor_reservado: input.valorNeto }
          : {}),
      },
    });

    if (resultado.count !== 1) {
      throw new SolicitudesPagoCambioConcurrenteError();
    }

    return tx.solicitudes_pago.findUniqueOrThrow({
      where: { id: input.solicitudId },
      include: solicitudPagoInclude,
    });
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
        numero_solicitud: null,
      },
      data: {
        estado_actual: "PENDIENTE_APROBADOR_1",
        enviado_en: input.enviadoEn,
      },
    });

    if (resultado.count === 0) {
      return null;
    }

    const solicitud = await tx.solicitudes_pago.findUnique({
      where: {
        id: input.solicitudId,
      },
      select: {
        id: true,
        proyecto_base_id: true,
        centro_costo_id: true,
        proyecto_base: {
          select: {
            nombre: true,
          },
        },
        centro_costo: {
          select: {
            linea_negocio: true,
            fase_centro_costo: true,
          },
        },
      },
    });

    if (!solicitud) {
      throw new Error("La solicitud de pago no existe.");
    }

    const centroCostoReferencia = obtenerReferenciaCentroCosto({
      lineaNegocio: solicitud.centro_costo.linea_negocio,
      faseCentroCosto: solicitud.centro_costo.fase_centro_costo,
    });

    const secuencia = await generarSecuenciaDocumentalRepository(
      {
        tipo_secuencia: "SOLICITUD_PAGO",
        proyecto_base_id: solicitud.proyecto_base_id,
        centro_costo_id: solicitud.centro_costo_id,
        proyecto_referencia: solicitud.proyecto_base.nombre,
        centro_costo_referencia: centroCostoReferencia,
        clave_contexto:
          `CENTRO:${solicitud.proyecto_base_id}:${solicitud.centro_costo_id}`,
        prefijo: "SOL",
        anio: input.enviadoEn.getFullYear(),
      },
      tx,
    );

    await tx.solicitudes_pago.update({
      where: {
        id: solicitud.id,
      },
      data: {
        numero_solicitud: secuencia.referencia,
        actualizado_en: input.enviadoEn,
      },
    });

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
          estado_actual: solicitud.estado_origen,
          valor_reservado:
            solicitud.estado_origen === "PENDIENTE_APROBADOR_1"
              ? null
              : { not: null },
        },
        data: {
          estado_actual: "PENDIENTE_APROBADOR_2",
          ...(solicitud.estado_origen === "PENDIENTE_APROBADOR_1"
            ? { valor_reservado: solicitud.valor_reservado }
            : {}),
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

export async function devolverSolicitudPagoRepository(input: {
  solicitudId: string;
  estadoOrigen:
    | "PENDIENTE_APROBADOR_1"
    | "PENDIENTE_APROBADOR_2"
    | "DEVUELTA_APROBADOR_1";
  estadoDestino:
    | "DEVUELTA_APROBADOR_1"
    | "DEVUELTA_SOLICITANTE";
  motivo: string;
  usuarioId: string;
  fecha: Date;
  liberarReserva: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const actualizada = await tx.solicitudes_pago.updateMany({
      where: {
        id: input.solicitudId,
        estado_actual: input.estadoOrigen,
      },
      data: {
        estado_actual: input.estadoDestino,
        ...(input.liberarReserva ? { valor_reservado: null } : {}),
        ...(input.estadoDestino === "DEVUELTA_APROBADOR_1"
          ? { devuelto_aprobador_1_en: input.fecha }
          : { devuelto_solicitante_en: input.fecha }),
        actualizado_en: input.fecha,
      },
    });

    if (actualizada.count !== 1) {
      throw new SolicitudesPagoCambioConcurrenteError();
    }

    await tx.devoluciones_solicitud_pago.create({
      data: {
        solicitud_pago_id: input.solicitudId,
        estado_origen: input.estadoOrigen,
        estado_destino: input.estadoDestino,
        motivo: input.motivo,
        devuelto_por: input.usuarioId,
        creado_en: input.fecha,
      },
    });

    return { count: actualizada.count };
  });
}

export async function devolverSolicitudesPagoRepository(input: {
  solicitudes: Array<{
    id: string;
    estadoOrigen: "PENDIENTE_APROBADOR_1" | "PENDIENTE_APROBADOR_2";
  }>;
  estadoDestino: "DEVUELTA_APROBADOR_1" | "DEVUELTA_SOLICITANTE";
  motivo: string;
  usuarioId: string;
  fecha: Date;
}) {
  return prisma.$transaction(async (tx) => {
    for (const solicitud of input.solicitudes) {
      const actualizada = await tx.solicitudes_pago.updateMany({
        where: {
          id: solicitud.id,
          estado_actual: solicitud.estadoOrigen,
        },
        data: {
          estado_actual: input.estadoDestino,
          ...(input.estadoDestino === "DEVUELTA_APROBADOR_1"
            ? { devuelto_aprobador_1_en: input.fecha }
            : { devuelto_solicitante_en: input.fecha }),
          actualizado_en: input.fecha,
        },
      });

      if (actualizada.count !== 1) {
        throw new SolicitudesPagoCambioConcurrenteError();
      }

      await tx.devoluciones_solicitud_pago.create({
        data: {
          solicitud_pago_id: solicitud.id,
          estado_origen: solicitud.estadoOrigen,
          estado_destino: input.estadoDestino,
          motivo: input.motivo,
          devuelto_por: input.usuarioId,
          creado_en: input.fecha,
        },
      });
    }

    return { count: input.solicitudes.length };
  });
}

export async function anularSolicitudesPagoRepository(input: {
  solicitudIds: string[];
  motivo: string;
  usuarioId: string;
  fecha: Date;
}) {
  return prisma.$transaction(async (tx) => {
    for (const solicitudId of input.solicitudIds) {
      const actualizada = await tx.solicitudes_pago.updateMany({
        where: {
          id: solicitudId,
          estado_actual: "PENDIENTE_APROBADOR_1",
        },
        data: {
          estado_actual: "ANULADA",
          valor_reservado: null,
          actualizado_en: input.fecha,
        },
      });

      if (actualizada.count !== 1) {
        throw new SolicitudesPagoCambioConcurrenteError();
      }

      await tx.anulaciones_solicitud_pago.create({
        data: {
          solicitud_pago_id: solicitudId,
          estado_origen: "PENDIENTE_APROBADOR_1",
          motivo: input.motivo,
          anulado_por: input.usuarioId,
          creado_en: input.fecha,
        },
      });
    }

    return { count: input.solicitudIds.length };
  });
}

export async function reenviarSolicitudDevueltaRepository(input: {
  solicitudId: string;
  estadoOrigen: "DEVUELTA_SOLICITANTE" | "DEVUELTA_APROBADOR_1";
  estadoDestino: "PENDIENTE_APROBADOR_1" | "PENDIENTE_APROBADOR_2";
  fecha: Date;
  valorReservado?: Prisma.Decimal;
}) {
  return prisma.solicitudes_pago.updateMany({
    where: {
      id: input.solicitudId,
      estado_actual: input.estadoOrigen,
    },
    data: {
      estado_actual: input.estadoDestino,
      ...(input.valorReservado !== undefined
        ? { valor_reservado: input.valorReservado }
        : {}),
      enviado_en: input.fecha,
      actualizado_en: input.fecha,
    },
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

export async function registrarTransferenciasRepository(input: {
  pagos: RegistrarTransferenciaRepositoryInput[];
  usuarioId: string;
  fechaRegistro: Date;
}) {
  return prisma.$transaction(
    async (tx) => {
      const ids = input.pagos.map((pago) => pago.solicitud_id);
      const solicitudes = await tx.solicitudes_pago.findMany({
        where: { id: { in: ids } },
        include: solicitudPagoInclude,
      });

      if (solicitudes.length !== ids.length) {
        throw new RegistroPagosError(
          "Una o más solicitudes seleccionadas no existen.",
        );
      }

      const porId = new Map(
        solicitudes.map((solicitud) => [solicitud.id, solicitud]),
      );
      const resumenPorProyecto = new Map<
        string,
        {
          proyecto_base_id: string;
          proyecto_nombre: string;
          saldo_anterior: number;
          total_pagado: number;
          saldo_nuevo: number;
        }
      >();
      const actualizadas = [];

      const pagosOrdenados = [...input.pagos].sort((a, b) => {
        const solicitudA = porId.get(a.solicitud_id)!;
        const solicitudB = porId.get(b.solicitud_id)!;

        return (
          solicitudA.fondo_id.localeCompare(solicitudB.fondo_id) ||
          solicitudA.id.localeCompare(solicitudB.id)
        );
      });

      for (const pagoInput of pagosOrdenados) {
        const solicitud = porId.get(pagoInput.solicitud_id)!;
        const numero = solicitud.numero_solicitud ?? solicitud.id;
        const valor = solicitud.valor_neto.toNumber();

        if (solicitud.estado_actual !== "PROGRAMADA_PAGO") {
          throw new RegistroPagosError(
            `La solicitud ${numero} ya no está programada para pago.`,
          );
        }

        if (
          solicitud.medio_pago !== "TRANSFERENCIA" &&
          solicitud.medio_pago !== "PSE" &&
          solicitud.medio_pago !== "PORTAL"
        ) {
          throw new RegistroPagosError(
            `La solicitud ${numero} no tiene un medio de pago directo.`,
          );
        }

        const cambioEstado = await tx.solicitudes_pago.updateMany({
          where: {
            id: solicitud.id,
            estado_actual: "PROGRAMADA_PAGO",
            medio_pago: { in: ["TRANSFERENCIA", "PSE", "PORTAL"] },
            pagos: null,
          },
          data: {
            estado_actual: "PAGADA",
            valor_pagado: valor,
            valor_reservado: null,
            pagado_por: input.usuarioId,
            pagado_en: pagoInput.fecha_pago,
            actualizado_en: input.fechaRegistro,
          },
        });

        if (cambioEstado.count !== 1) {
          throw new RegistroPagosError(
            `La solicitud ${numero} cambió durante el registro del pago.`,
          );
        }

        const soporte = await tx.adjuntos.create({
          data: {
            solicitud_pago_id: solicitud.id,
            ...pagoInput.soporte,
            subido_por: input.usuarioId,
            estado_ocr: "NO_PROCESADO",
          },
        });
        const pago = await tx.pagos.create({
          data: {
            solicitud_pago_id: solicitud.id,
            adjunto_soporte_id: soporte.id,
            fecha_pago: pagoInput.fecha_pago,
            medio_pago: solicitud.medio_pago,
            numero_comprobante: pagoInput.numero_comprobante,
            observacion: pagoInput.observacion,
            valor_pagado: valor,
            registrado_por: input.usuarioId,
            registrado_en: input.fechaRegistro,
          },
        });

        const movimiento = await registrarMovimientoPago(
          tx,
          {
            fondo_id: solicitud.fondo_id,
            proyecto_base_id: solicitud.proyecto_base_id,
            centro_costo_id: solicitud.centro_costo_id,
            solicitud_pago_id: solicitud.id,
            pago_id: pago.id,
            tipo_movimiento: "EGRESO_SOLICITUD_PAGO",
            direccion: "EGRESO",
            valor,
            referencia_sistema: pagoInput.numero_comprobante,
            descripcion:
              pagoInput.observacion ??
              `Pago de la solicitud ${numero}.`,
            registrado_por: input.usuarioId,
            registrado_en: input.fechaRegistro,
          },
          `El proyecto ${solicitud.proyecto_base.nombre} no tiene saldo suficiente para registrar el lote.`,
        );

        const resumen = resumenPorProyecto.get(
          solicitud.proyecto_base_id,
        );

        if (resumen) {
          resumen.total_pagado += valor;
          resumen.saldo_nuevo = movimiento.saldo_nuevo;
        } else {
          resumenPorProyecto.set(solicitud.proyecto_base_id, {
            proyecto_base_id: solicitud.proyecto_base_id,
            proyecto_nombre: solicitud.proyecto_base.nombre,
            saldo_anterior: movimiento.saldo_anterior,
            total_pagado: valor,
            saldo_nuevo: movimiento.saldo_nuevo,
          });
        }

        actualizadas.push(
          await tx.solicitudes_pago.findUniqueOrThrow({
            where: { id: solicitud.id },
            include: solicitudPagoInclude,
          }),
        );
      }

      return {
        solicitudes: actualizadas,
        resumen_proyectos: Array.from(resumenPorProyecto.values()),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function registrarOperacionEfectivoRepository(input: {
  operacion: RegistrarOperacionEfectivoRepositoryInput;
  usuarioId: string;
  fechaRegistro: Date;
}) {
  return prisma.$transaction(
    async (tx) => {
      const ids = input.operacion.detalles.map(
        (detalle) => detalle.solicitud_id,
      );
      const solicitudes = await tx.solicitudes_pago.findMany({
        where: { id: { in: ids } },
        include: solicitudPagoInclude,
      });

      if (solicitudes.length !== ids.length) {
        throw new RegistroPagosError(
          "Una o más solicitudes seleccionadas no existen.",
        );
      }

      const porId = new Map(
        solicitudes.map((solicitud) => [solicitud.id, solicitud]),
      );
      const detallesOrdenados = [...input.operacion.detalles].sort((a, b) =>
        a.solicitud_id.localeCompare(b.solicitud_id),
      );
      const primeraSolicitud = porId.get(detallesOrdenados[0].solicitud_id)!;
      let valorRequerido = 0;

      for (const detalle of detallesOrdenados) {
        const solicitud = porId.get(detalle.solicitud_id)!;
        const numero = solicitud.numero_solicitud ?? solicitud.id;

        if (solicitud.estado_actual !== "PROGRAMADA_PAGO") {
          throw new RegistroPagosError(
            `La solicitud ${numero} ya no está programada para pago.`,
          );
        }

        if (
          solicitud.medio_pago !== "CONSIGNACION" &&
          solicitud.medio_pago !== "EFECTIVO"
        ) {
          throw new RegistroPagosError(
            `La solicitud ${numero} no se paga mediante retiro de efectivo.`,
          );
        }

        if (
          solicitud.proyecto_base_id !==
            primeraSolicitud.proyecto_base_id ||
          solicitud.fondo_id !== primeraSolicitud.fondo_id
        ) {
          throw new RegistroPagosError(
            "Todas las solicitudes del retiro deben pertenecer al mismo proyecto y fondo.",
          );
        }

        if (
          solicitud.medio_pago === "CONSIGNACION" &&
          !detalle.numero_comprobante
        ) {
          throw new RegistroPagosError(
            `La consignación de la solicitud ${numero} requiere referencia.`,
          );
        }

        valorRequerido += solicitud.valor_neto.toNumber();
      }

      if (input.operacion.valor_retirado < valorRequerido) {
        throw new RegistroPagosError(
          "El valor retirado no alcanza para cubrir las solicitudes seleccionadas.",
        );
      }

      const valorSobrante =
        input.operacion.valor_retirado - valorRequerido;

      const soporteRetiro = await tx.adjuntos.create({
        data: {
          ...input.operacion.soporte_retiro,
          subido_por: input.usuarioId,
          estado_ocr: "NO_PROCESADO",
        },
      });
      const operacion = await tx.operaciones_efectivo.create({
        data: {
          proyecto_base_id: primeraSolicitud.proyecto_base_id,
          fondo_id: primeraSolicitud.fondo_id,
          adjunto_retiro_id: soporteRetiro.id,
          fecha_retiro: input.operacion.fecha_retiro,
          valor_requerido: valorRequerido,
          valor_retirado: input.operacion.valor_retirado,
          valor_pagado: valorRequerido,
          valor_sobrante: valorSobrante,
          sobrante_reintegrado:
            input.operacion.reintegrar_sobrante && valorSobrante > 0,
          observacion: input.operacion.observacion,
          registrado_por: input.usuarioId,
          registrado_en: input.fechaRegistro,
        },
      });

      const movimientoRetiro = await registrarMovimientoPago(
        tx,
        {
          fondo_id: primeraSolicitud.fondo_id,
          proyecto_base_id: primeraSolicitud.proyecto_base_id,
          operacion_efectivo_id: operacion.id,
          tipo_movimiento: "EGRESO_RETIRO_EFECTIVO",
          direccion: "EGRESO",
          valor: input.operacion.valor_retirado,
          descripcion:
            input.operacion.observacion ??
            `Retiro para pagar ${detallesOrdenados.length} solicitud(es).`,
          registrado_por: input.usuarioId,
          registrado_en: input.fechaRegistro,
        },
        `El proyecto ${primeraSolicitud.proyecto_base.nombre} no tiene saldo suficiente para registrar el retiro.`,
      );

      const actualizadas = [];

      for (const detalle of detallesOrdenados) {
        const solicitud = porId.get(detalle.solicitud_id)!;
        const numero = solicitud.numero_solicitud ?? solicitud.id;
        const valorPagado = solicitud.valor_neto.toNumber();
        const cambioEstado = await tx.solicitudes_pago.updateMany({
          where: {
            id: solicitud.id,
            estado_actual: "PROGRAMADA_PAGO",
            medio_pago: { in: ["CONSIGNACION", "EFECTIVO"] },
            detalleOperacionEfectivo: null,
          },
          data: {
            estado_actual: "PAGADA",
            valor_pagado: valorPagado,
            valor_reservado: null,
            pagado_por: input.usuarioId,
            pagado_en: input.operacion.fecha_retiro,
            actualizado_en: input.fechaRegistro,
          },
        });

        if (cambioEstado.count !== 1) {
          throw new RegistroPagosError(
            `La solicitud ${numero} cambió durante el registro del pago.`,
          );
        }

        const soporte = await tx.adjuntos.create({
          data: {
            solicitud_pago_id: solicitud.id,
            ...detalle.soporte,
            subido_por: input.usuarioId,
            estado_ocr: "NO_PROCESADO",
          },
        });

        await tx.detalles_operacion_efectivo.create({
          data: {
            operacion_efectivo_id: operacion.id,
            solicitud_pago_id: solicitud.id,
            adjunto_soporte_id: soporte.id,
            medio_pago: solicitud.medio_pago!,
            valor_pagado: valorPagado,
            numero_comprobante: detalle.numero_comprobante,
            observacion: detalle.observacion,
          },
        });

        actualizadas.push(
          await tx.solicitudes_pago.findUniqueOrThrow({
            where: { id: solicitud.id },
            include: solicitudPagoInclude,
          }),
        );
      }

      let saldoFinal = movimientoRetiro.saldo_nuevo;

      if (input.operacion.reintegrar_sobrante && valorSobrante > 0) {
        const movimientoReintegro = await registrarMovimientoPago(
          tx,
          {
            fondo_id: primeraSolicitud.fondo_id,
            proyecto_base_id: primeraSolicitud.proyecto_base_id,
            operacion_efectivo_id: operacion.id,
            tipo_movimiento: "INGRESO_REINTEGRO_EFECTIVO",
            direccion: "INGRESO",
            valor: valorSobrante,
            descripcion: "Reintegro del sobrante del retiro.",
            registrado_por: input.usuarioId,
            registrado_en: input.fechaRegistro,
          },
          "",
        );
        saldoFinal = movimientoReintegro.saldo_nuevo;
      }

      return {
        operacion: {
          id: operacion.id,
          proyecto_base_id: primeraSolicitud.proyecto_base_id,
          proyecto_nombre: primeraSolicitud.proyecto_base.nombre,
          valor_requerido: valorRequerido,
          valor_retirado: input.operacion.valor_retirado,
          valor_pagado: valorRequerido,
          valor_sobrante: valorSobrante,
          sobrante_reintegrado:
            input.operacion.reintegrar_sobrante && valorSobrante > 0,
          saldo_anterior: movimientoRetiro.saldo_anterior,
          saldo_nuevo: saldoFinal,
        },
        solicitudes: actualizadas,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
