import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { listarBandejaPagosService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type { SolicitudPagoListFilters } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { cookies } from "next/headers";

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
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

    const { searchParams } = new URL(request.url);

    const filtros: SolicitudPagoListFilters = {
      proyecto_base_id:
        searchParams.get("proyecto_base_id")?.trim() || undefined,
      centro_costo_id:
        searchParams.get("centro_costo_id")?.trim() || undefined,
      medio_pago:
        searchParams.get("medio_pago")?.trim().toUpperCase() || undefined,
      busqueda: searchParams.get("busqueda")?.trim() || undefined,
    } as SolicitudPagoListFilters;

    const resultado = await listarBandejaPagosService(
      resultadoAutenticacion.body.data.usuario,
      filtros,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error consultando la bandeja de pagos:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible consultar la bandeja de pagos.",
      },
      {
        status: 500,
      },
    );
  }
}
