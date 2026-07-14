import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { obtenerSolicitudPagoPorIdService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
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