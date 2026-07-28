import type { UsuarioSesion } from "@/modules/auth/auth.types";
import {
  consultarFondosRepository,
  consultarMovimientosFondoRepository,
} from "./fondos.repository";
import type {
  ConsultarMovimientosFondoData,
  ConsultarFondosData,
  FiltrosMovimientosFondo,
  MovimientoFondoConsulta,
  ProyectoFondoGeneral,
  ResumenAgrupadoFondo,
  VisibilidadFondos,
} from "./fondos.types";

function obtenerVisibilidadFondos(
  usuario: UsuarioSesion,
): VisibilidadFondos {
  const tieneVisibilidadTotal = [
    "ADMINISTRADOR",
    "AUXILIAR_CONTABLE",
    "PAGOS",
  ].some((rol) => usuario.roles.includes(rol));

  return tieneVisibilidadTotal
    ? { tipo: "TOTAL" }
    : { tipo: "ACCESOS", usuario_id: usuario.id };
}

function agruparGasto(
  centros: ProyectoFondoGeneral["centros_costo"],
  campo: "linea_negocio" | "fase_centro_costo",
): ResumenAgrupadoFondo[] {
  const resumen = new Map<string, number>();

  for (const centro of centros) {
    resumen.set(
      centro[campo],
      (resumen.get(centro[campo]) ?? 0) + centro.gasto_acumulado,
    );
  }

  return Array.from(resumen.entries()).map(
    ([clave, gasto_acumulado]) => ({
      clave,
      gasto_acumulado,
    }),
  );
}

export async function consultarFondosService(
  usuario: UsuarioSesion,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: ConsultarFondosData;
  };
}> {
  if (!usuario.permisos.includes("CONSULTAR_FONDOS")) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para consultar los fondos.",
      },
    };
  }

  const visibilidad = obtenerVisibilidadFondos(usuario);
  const proyectos = await consultarFondosRepository(visibilidad);
  const resultado: ProyectoFondoGeneral[] = proyectos
    .filter((proyecto) => proyecto.fondo)
    .map((proyecto) => {
      const centros = proyecto.centros_costo.map((centro) => {
        const gastoMovimientos = centro.movimientosFondos
          .filter(
            (movimiento) =>
              movimiento.tipo_movimiento !==
              "EGRESO_RETIRO_EFECTIVO",
          )
          .reduce(
            (total, movimiento) =>
              total + movimiento.valor.toNumber(),
            0,
          );
        const gastoRetiros = centro.solicitudes_pago.reduce(
          (total, solicitud) =>
            total +
            (solicitud.detalleOperacionEfectivo?.valor_pagado.toNumber() ??
              0),
          0,
        );

        return {
          id: centro.id,
          codigo: centro.codigo,
          nombre: centro.nombre,
          linea_negocio: centro.linea_negocio,
          fase_centro_costo: centro.fase_centro_costo,
          estado_centro_costo: centro.estado_centro_costo,
          gasto_acumulado: gastoMovimientos + gastoRetiros,
        };
      });

      return {
        proyecto_base_id: proyecto.id,
        proyecto_nombre: proyecto.nombre,
        estado_proyecto: proyecto.estado_proyecto,
        fondo_id: proyecto.fondo!.id,
        fondo_nombre: proyecto.fondo!.nombre,
        saldo_actual: proyecto.fondo!.saldo_actual.toNumber(),
        gasto_total_visible: centros.reduce(
          (total, centro) => total + centro.gasto_acumulado,
          0,
        ),
        centros_costo: centros,
        gasto_por_linea: agruparGasto(centros, "linea_negocio"),
        gasto_por_fase: agruparGasto(centros, "fase_centro_costo"),
      };
    });

  return {
    status: 200,
    body: {
      ok: true,
      message: "Fondos consultados correctamente.",
      data: {
        proyectos: resultado,
      },
    },
  };
}

export async function consultarMovimientosFondoService(
  usuario: UsuarioSesion,
  filtros: FiltrosMovimientosFondo,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: ConsultarMovimientosFondoData;
  };
}> {
  if (!usuario.permisos.includes("CONSULTAR_FONDOS")) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "No tiene permisos para consultar los movimientos financieros.",
      },
    };
  }

  if (
    filtros.direccion &&
    !["INGRESO", "EGRESO"].includes(filtros.direccion)
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "La dirección del movimiento no es válida.",
      },
    };
  }

  const registros = await consultarMovimientosFondoRepository(
    obtenerVisibilidadFondos(usuario),
    filtros,
  );
  const movimientos: MovimientoFondoConsulta[] = registros.map(
    (movimiento) => ({
      id: movimiento.id,
      proyecto_base_id: movimiento.proyecto_base.id,
      proyecto_nombre: movimiento.proyecto_base.nombre,
      centro_costo_id: movimiento.centro_costo?.id ?? null,
      centro_costo_codigo:
        movimiento.centro_costo?.codigo ?? null,
      centro_costo_nombre:
        movimiento.centro_costo?.nombre ?? null,
      linea_negocio:
        movimiento.centro_costo?.linea_negocio ?? null,
      fase_centro_costo:
        movimiento.centro_costo?.fase_centro_costo ?? null,
      tipo_movimiento: movimiento.tipo_movimiento,
      direccion: movimiento.direccion,
      valor: movimiento.valor.toNumber(),
      saldo_anterior: movimiento.saldo_anterior.toNumber(),
      saldo_nuevo: movimiento.saldo_nuevo.toNumber(),
      referencia_sistema: movimiento.referencia_sistema,
      descripcion: movimiento.descripcion,
      registrado_en: movimiento.registrado_en.toISOString(),
    }),
  );

  return {
    status: 200,
    body: {
      ok: true,
      message: "Movimientos financieros consultados correctamente.",
      data: {
        movimientos,
        tipos_movimiento: Array.from(
          new Set(
            movimientos.map(
              (movimiento) => movimiento.tipo_movimiento,
            ),
          ),
        ).sort(),
      },
    },
  };
}
