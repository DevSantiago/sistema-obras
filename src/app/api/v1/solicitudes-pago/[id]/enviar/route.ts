import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { enviarSolicitudPagoService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
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

export async function POST(
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

    const resultado = await enviarSolicitudPagoService(
      resultadoAutenticacion.body.data.usuario,
      id,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error enviando solicitud de pago:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible enviar la solicitud de pago.",
      },
      {
        status: 500,
      },
    );
  }
}
