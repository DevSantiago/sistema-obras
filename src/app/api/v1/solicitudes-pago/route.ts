import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  crearSolicitudPagoProveedorService,
  listarSolicitudesPagoService,
} from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type {
  CrearSolicitudPagoProveedorInput,
  SolicitudPagoListFilters,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { cookies } from "next/headers";

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

export async function GET(request: Request) {
  try {
    const resultadoAutenticacion = await obtenerUsuarioSesionDesdeCookie();

    if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    const { searchParams } = new URL(request.url);

    const filters: SolicitudPagoListFilters = {
      tipo_solicitud:
        searchParams.get("tipo_solicitud")?.trim().toUpperCase() || undefined,
      estado_actual:
        searchParams.get("estado_actual")?.trim().toUpperCase() || undefined,
      proyecto_base_id: searchParams.get("proyecto_base_id") || undefined,
      centro_costo_id: searchParams.get("centro_costo_id") || undefined,
      beneficiario_id: searchParams.get("beneficiario_id") || undefined,
      medio_pago:
        searchParams.get("medio_pago")?.trim().toUpperCase() || undefined,
      busqueda: searchParams.get("busqueda") || undefined,
    } as SolicitudPagoListFilters;

    const resultado = await listarSolicitudesPagoService(
      resultadoAutenticacion.body.data.usuario,
      filters,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error consultando solicitudes de pago:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible consultar las solicitudes de pago.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const resultadoAutenticacion = await obtenerUsuarioSesionDesdeCookie();

    if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    let body: CrearSolicitudPagoProveedorInput;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          ok: false,
          message: "El cuerpo de la solicitud debe ser JSON válido.",
        },
        { status: 400 },
      );
    }

    const resultado = await crearSolicitudPagoProveedorService(
      resultadoAutenticacion.body.data.usuario,
      body,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error creando solicitud de pago:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible crear la solicitud de pago.",
      },
      { status: 500 },
    );
  }
}