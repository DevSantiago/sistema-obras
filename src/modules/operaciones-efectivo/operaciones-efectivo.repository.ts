import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarMovimientoFondoEnTransaccionRepository } from "@/modules/fondos/movimientos-fondo.repository";
import { generarSecuenciaDocumentalRepository } from "@/modules/secuencias/secuencias.repository";
import type {
  FiltrosOperacionesEfectivo,
  CorreccionOperacionEfectivoRegistrada,
  RegistrarCorreccionOperacionEfectivoRepositoryInput,
  RegistrarReingresoSobranteRepositoryInput,
  ReingresoSobranteRegistrado,
} from "./operaciones-efectivo.types";

export class ReingresoSobranteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReingresoSobranteError";
  }
}

export class CorreccionOperacionEfectivoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CorreccionOperacionEfectivoError";
  }
}

export function calcularPendienteOperacionEfectivo(
  valorSobrante: number,
  valorReintegrado: number,
  ajustes: Array<{
    direccion: string | null;
    valor: number;
  }>,
) {
  const valorAjustado = ajustes.reduce(
    (total, ajuste) =>
      total +
      (ajuste.direccion === "INGRESO" ? -1 : 1) * ajuste.valor,
    0,
  );

  return Math.max(0, valorSobrante - valorReintegrado + valorAjustado);
}

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
      estado: true,
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
      reingresos: {
        orderBy: { fecha_reingreso: "asc" },
        select: {
          id: true,
          referencia_sistema: true,
          valor: true,
          pendiente_anterior: true,
          pendiente_nuevo: true,
          fecha_reingreso: true,
          observacion: true,
          registrador: {
            select: { nombre: true },
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
      correcciones: {
        orderBy: { registrado_en: "asc" },
        select: {
          id: true,
          referencia_sistema: true,
          tipo: true,
          direccion: true,
          valor: true,
          pendiente_anterior: true,
          pendiente_nuevo: true,
          motivo: true,
          observacion: true,
          registrado_en: true,
          registrador: { select: { nombre: true } },
        },
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
        {
          soportes_reingreso: {
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

export async function registrarReingresoSobranteRepository(
  input: RegistrarReingresoSobranteRepositoryInput,
): Promise<ReingresoSobranteRegistrado> {
  return prisma.$transaction(
    async (tx) => {
      const operacion = await tx.operaciones_efectivo.findUnique({
        where: { id: input.operacion_efectivo_id },
        select: {
          id: true,
          valor_sobrante: true,
          sobrante_reintegrado: true,
          estado: true,
          proyecto_base: { select: { id: true, nombre: true } },
          fondo: { select: { id: true } },
          movimientos: {
            where: {
              tipo_movimiento: "INGRESO_REINTEGRO_EFECTIVO",
            },
            select: { valor: true },
          },
          correcciones: {
            where: { tipo: "AJUSTE" },
            select: { direccion: true, valor: true },
          },
        },
      });

      if (!operacion) {
        throw new ReingresoSobranteError(
          "La operación de efectivo no existe.",
        );
      }

      if (operacion.estado === "ANULADA") {
        throw new ReingresoSobranteError(
          "No se pueden registrar reingresos sobre una operación anulada.",
        );
      }

      const valorSobrante = operacion.valor_sobrante.toNumber();
      const valorReintegrado = operacion.movimientos.reduce(
        (total, movimiento) => total + movimiento.valor.toNumber(),
        0,
      );
      const pendienteAnterior = calcularPendienteOperacionEfectivo(
        valorSobrante,
        valorReintegrado,
        operacion.correcciones.map((correccion) => ({
          direccion: correccion.direccion,
          valor: correccion.valor?.toNumber() ?? 0,
        })),
      );

      if (
        operacion.sobrante_reintegrado ||
        pendienteAnterior <= 0
      ) {
        throw new ReingresoSobranteError(
          "La operación no tiene sobrante pendiente de reintegro.",
        );
      }

      if (input.valor > pendienteAnterior) {
        throw new ReingresoSobranteError(
          "El valor del reingreso no puede superar el sobrante pendiente.",
        );
      }

      const secuencia = await generarSecuenciaDocumentalRepository(
        {
          tipo_secuencia: "REINGRESO_SOBRANTE",
          proyecto_base_id: operacion.proyecto_base.id,
          centro_costo_id: null,
          proyecto_referencia: operacion.proyecto_base.nombre,
          centro_costo_referencia: null,
          clave_contexto: `PROYECTO:${operacion.proyecto_base.id}`,
          prefijo: "REI",
          anio: input.fecha_operacion.getUTCFullYear(),
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
      const pendienteNuevo = pendienteAnterior - input.valor;
      const reingreso =
        await tx.reingresos_sobrante_efectivo.create({
          data: {
            operacion_efectivo_id: operacion.id,
            adjunto_soporte_id: soporte.id,
            referencia_sistema: secuencia.referencia,
            valor: input.valor,
            pendiente_anterior: pendienteAnterior,
            pendiente_nuevo: pendienteNuevo,
            fecha_reingreso: input.fecha_operacion,
            observacion: input.observacion,
            registrado_por: input.usuario_id,
            registrado_en: input.fecha_operacion,
          },
          select: { id: true },
        });
      const operacionActualizada =
        await tx.operaciones_efectivo.updateMany({
          where: {
            id: operacion.id,
            sobrante_reintegrado: false,
          },
          data: {
            sobrante_reintegrado: pendienteNuevo === 0,
          },
        });

      if (operacionActualizada.count !== 1) {
        throw new ReingresoSobranteError(
          "El sobrante de la operación cambió. Intente nuevamente.",
        );
      }

      const movimiento =
        await registrarMovimientoFondoEnTransaccionRepository(tx, {
          fondo_id: operacion.fondo.id,
          proyecto_base_id: operacion.proyecto_base.id,
          operacion_efectivo_id: operacion.id,
          reingreso_sobrante_id: reingreso.id,
          tipo_movimiento: "INGRESO_REINTEGRO_EFECTIVO",
          direccion: "INGRESO",
          valor: input.valor,
          referencia_sistema: secuencia.referencia,
          descripcion:
            input.observacion ??
            "Reingreso posterior del sobrante del retiro.",
          registrado_por: input.usuario_id,
          registrado_en: input.fecha_operacion,
        });

      return {
        id: reingreso.id,
        referencia_sistema: secuencia.referencia,
        operacion_efectivo_id: operacion.id,
        valor: input.valor,
        pendiente_anterior: pendienteAnterior,
        pendiente_nuevo: pendienteNuevo,
        estado_seguimiento:
          pendienteNuevo === 0
            ? "SOBRANTE_REINTEGRADO"
            : "SOBRANTE_PENDIENTE_REINGRESO",
        saldo_fondo_anterior: movimiento.saldo_anterior,
        saldo_fondo_nuevo: movimiento.saldo_nuevo,
        fecha_operacion: input.fecha_operacion.toISOString(),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function registrarCorreccionOperacionEfectivoRepository(
  input: RegistrarCorreccionOperacionEfectivoRepositoryInput,
): Promise<CorreccionOperacionEfectivoRegistrada> {
  return prisma.$transaction(
    async (tx) => {
      const operacion = await tx.operaciones_efectivo.findUnique({
        where: { id: input.operacion_efectivo_id },
        select: {
          id: true,
          estado: true,
          valor_sobrante: true,
          proyecto_base: { select: { id: true, nombre: true } },
          fondo: { select: { id: true, saldo_actual: true } },
          movimientos: {
            select: { direccion: true, valor: true },
          },
          reingresos: { select: { valor: true } },
          correcciones: {
            where: { tipo: "AJUSTE" },
            select: { direccion: true, valor: true },
          },
        },
      });

      if (!operacion) {
        throw new CorreccionOperacionEfectivoError(
          "La operación de efectivo no existe.",
        );
      }

      if (operacion.estado === "ANULADA") {
        throw new CorreccionOperacionEfectivoError(
          "La operación ya fue anulada.",
        );
      }

      let direccion = input.direccion ?? null;
      let valor = input.valor ?? null;
      const valorReintegrado = operacion.reingresos.reduce(
        (total, reingreso) => total + reingreso.valor.toNumber(),
        0,
      );
      const pendienteAnterior = calcularPendienteOperacionEfectivo(
        operacion.valor_sobrante.toNumber(),
        valorReintegrado,
        operacion.correcciones.map((correccion) => ({
          direccion: correccion.direccion,
          valor: correccion.valor?.toNumber() ?? 0,
        })),
      );
      let pendienteNuevo: number | null = null;

      if (input.tipo === "AJUSTE" && direccion && valor) {
        pendienteNuevo =
          direccion === "INGRESO"
            ? pendienteAnterior - valor
            : pendienteAnterior + valor;

        if (pendienteNuevo < 0) {
          throw new CorreccionOperacionEfectivoError(
            "El ingreso del ajuste no puede superar el sobrante pendiente.",
          );
        }
      }

      if (input.tipo === "ANULACION") {
        const efectoNeto = operacion.movimientos.reduce(
          (total, movimiento) =>
            total +
            (movimiento.direccion === "INGRESO" ? 1 : -1) *
              movimiento.valor.toNumber(),
          0,
        );

        direccion =
          efectoNeto < 0 ? "INGRESO" : efectoNeto > 0 ? "EGRESO" : null;
        valor = Math.abs(efectoNeto) || null;
      }

      const secuencia = await generarSecuenciaDocumentalRepository(
        {
          tipo_secuencia: "CORRECCION_EFECTIVO",
          proyecto_base_id: operacion.proyecto_base.id,
          centro_costo_id: null,
          proyecto_referencia: operacion.proyecto_base.nombre,
          centro_costo_referencia: null,
          clave_contexto: `PROYECTO:${operacion.proyecto_base.id}`,
          prefijo: "COR",
          anio: input.fecha_operacion.getUTCFullYear(),
        },
        tx,
      );
      const correccion =
        await tx.correcciones_operacion_efectivo.create({
          data: {
            operacion_efectivo_id: operacion.id,
            referencia_sistema: secuencia.referencia,
            tipo: input.tipo,
            direccion,
            valor,
            pendiente_anterior:
              input.tipo === "AJUSTE" ? pendienteAnterior : null,
            pendiente_nuevo: pendienteNuevo,
            motivo: input.motivo,
            observacion: input.observacion,
            registrado_por: input.usuario_id,
            registrado_en: input.fecha_operacion,
          },
          select: { id: true },
        });
      const estadoOperacion =
        input.tipo === "ANULACION" ? "ANULADA" : "AJUSTADA";
      const operacionActualizada =
        await tx.operaciones_efectivo.updateMany({
          where: {
            id: operacion.id,
            estado: { not: "ANULADA" },
          },
          data: {
            estado: estadoOperacion,
            ...(input.tipo === "AJUSTE"
              ? { sobrante_reintegrado: pendienteNuevo === 0 }
              : {}),
          },
        });

      if (operacionActualizada.count !== 1) {
        throw new CorreccionOperacionEfectivoError(
          "El estado de la operación cambió. Intente nuevamente.",
        );
      }

      let saldoAnterior: number | null = null;
      let saldoNuevo: number | null = null;

      if (direccion && valor) {
        const movimiento =
          await registrarMovimientoFondoEnTransaccionRepository(tx, {
            fondo_id: operacion.fondo.id,
            proyecto_base_id: operacion.proyecto_base.id,
            operacion_efectivo_id: operacion.id,
            correccion_efectivo_id: correccion.id,
            tipo_movimiento:
              input.tipo === "ANULACION"
                ? "COMPENSACION_ANULACION_EFECTIVO"
                : `AJUSTE_EFECTIVO_${direccion}`,
            direccion,
            valor,
            referencia_sistema: secuencia.referencia,
            descripcion: `${input.motivo}${
              input.observacion ? `: ${input.observacion}` : ""
            }`,
            registrado_por: input.usuario_id,
            registrado_en: input.fecha_operacion,
          });

        saldoAnterior = movimiento.saldo_anterior;
        saldoNuevo = movimiento.saldo_nuevo;
      }

      return {
        id: correccion.id,
        referencia_sistema: secuencia.referencia,
        tipo: input.tipo,
        direccion,
        valor,
        pendiente_anterior:
          input.tipo === "AJUSTE" ? pendienteAnterior : null,
        pendiente_nuevo: pendienteNuevo,
        estado_operacion: estadoOperacion,
        saldo_fondo_anterior: saldoAnterior,
        saldo_fondo_nuevo: saldoNuevo,
        registrado_en: input.fecha_operacion.toISOString(),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
