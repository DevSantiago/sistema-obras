import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { consultarMovimientosFondoService } from "@/modules/fondos/fondos.service";
import type { FiltrosMovimientosFondo } from "@/modules/fondos/fondos.types";

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

function obtenerFiltros(request: Request): FiltrosMovimientosFondo {
  const parametros = new URL(request.url).searchParams;

  return {
    proyecto_base_id:
      parametros.get("proyecto_base_id")?.trim() || undefined,
    centro_costo_id:
      parametros.get("centro_costo_id")?.trim() || undefined,
    linea_negocio:
      parametros.get("linea_negocio")?.trim() || undefined,
    fase_centro_costo:
      parametros.get("fase_centro_costo")?.trim() || undefined,
    direccion:
      (parametros.get("direccion")?.trim() as
        | "INGRESO"
        | "EGRESO") || undefined,
    tipo_movimiento:
      parametros.get("tipo_movimiento")?.trim() || undefined,
  };
}

export async function GET(request: Request) {
  try {
    const resultadoAutenticacion =
      await obtenerUsuarioSesionDesdeCookie();

    if (
      !resultadoAutenticacion.body.ok ||
      !resultadoAutenticacion.body.data
    ) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    const resultado = await consultarMovimientosFondoService(
      resultadoAutenticacion.body.data.usuario,
      obtenerFiltros(request),
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error consultando movimientos financieros:", error);

    return Response.json(
      {
        ok: false,
        message:
          "No fue posible consultar los movimientos financieros.",
      },
      { status: 500 },
    );
  }
}
