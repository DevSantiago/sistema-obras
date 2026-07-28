import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { consultarFondosRepository } from "./fondos.repository";
import type {
  ConsultarFondosData,
  ProyectoFondoGeneral,
  ResumenAgrupadoFondo,
  VisibilidadFondos,
} from "./fondos.types";

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

  const tieneVisibilidadTotal = [
    "ADMINISTRADOR",
    "AUXILIAR_CONTABLE",
    "PAGOS",
  ].some((rol) => usuario.roles.includes(rol));
  const visibilidad: VisibilidadFondos = tieneVisibilidadTotal
    ? { tipo: "TOTAL" }
    : { tipo: "ACCESOS", usuario_id: usuario.id };
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
