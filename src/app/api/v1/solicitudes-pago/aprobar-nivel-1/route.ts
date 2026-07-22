import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { 
  aprobarSolicitudesNivel1Service,
  consultarAprobacionesNivel1Service,
} from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type { AprobarSolicitudesNivel1Input } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { cookies } from "next/headers";

type JsonObject = Record<string, unknown>;

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

function esObjetoJson(valor: unknown): valor is JsonObject {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

export async function GET() {
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

    const resultado =
      await consultarAprobacionesNivel1Service(
        resultadoAutenticacion.body.data.usuario,
      );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error(
      "Error consultando aprobaciones de nivel 1:",
      error,
    );

    return Response.json(
      {
        ok: false,
        message:
          "No fue posible consultar las aprobaciones de nivel 1.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
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

    let json: unknown;

    try {
      json = await request.json();
    } catch {
      return Response.json(
        {
          ok: false,
          message:
            "El cuerpo de la solicitud debe ser un JSON válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (!esObjetoJson(json)) {
      return Response.json(
        {
          ok: false,
          message:
            "El cuerpo de la solicitud debe ser un objeto JSON válido.",
        },
        {
          status: 400,
        },
      );
    }

    const resultado = await aprobarSolicitudesNivel1Service(
      resultadoAutenticacion.body.data.usuario,
      json as AprobarSolicitudesNivel1Input,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error(
      "Error aprobando solicitudes de pago en nivel 1:",
      error,
    );

    return Response.json(
      {
        ok: false,
        message:
          "No fue posible aprobar las solicitudes de pago en nivel 1.",
      },
      {
        status: 500,
      },
    );
  }
}