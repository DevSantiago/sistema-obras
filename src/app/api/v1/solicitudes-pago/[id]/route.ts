import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  actualizarSolicitudNominaIndividualService,
  actualizarSolicitudPagoImpuestoService,
  actualizarSolicitudPagoProveedorService,
  actualizarSolicitudReembolsoService,
  obtenerSolicitudPagoPorIdService,
} from "@/modules/solicitudes-pago/solicitudes-pago.service";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const resultado = await obtenerSolicitudPagoPorIdService(
      resultadoAutenticacion.body.data.usuario,
      id,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error(
      "Error consultando solicitud de pago por ID:",
      error,
    );

    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No fue posible consultar la solicitud de pago.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const body = await request.json();

    const tipoSolicitud =
      typeof body?.tipo_solicitud === "string"
        ? body.tipo_solicitud.trim().toUpperCase()
        : "";

    const modalidadNomina =
      typeof body?.modalidad_nomina === "string"
        ? body.modalidad_nomina.trim().toUpperCase()
        : "";

    let resultado;

    if (
      tipoSolicitud === "PAGO_NOMINA" &&
      modalidadNomina === "INDIVIDUAL"
    ) {
      resultado =
        await actualizarSolicitudNominaIndividualService(
          resultadoAutenticacion.body.data.usuario,
          id,
          body,
        );
    } else if (tipoSolicitud === "PAGO_IMPUESTO") {
      resultado =
        await actualizarSolicitudPagoImpuestoService(
          resultadoAutenticacion.body.data.usuario,
          id,
          body,
        );
    } else if (tipoSolicitud === "REEMBOLSO") {
      resultado =
        await actualizarSolicitudReembolsoService(
          resultadoAutenticacion.body.data.usuario,
          id,
          body,
        );
    } else {
      resultado =
        await actualizarSolicitudPagoProveedorService(
          resultadoAutenticacion.body.data.usuario,
          id,
          body,
        );
    }

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error(
      "Error actualizando solicitud de pago:",
      error,
    );

    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No fue posible actualizar la solicitud de pago.",
      },
      {
        status: 500,
      },
    );
  }
}