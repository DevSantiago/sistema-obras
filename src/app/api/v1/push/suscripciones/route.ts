import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  consultarSuscripcionesPushService,
  desactivarSuscripcionPushService,
  registrarSuscripcionPushService,
} from "@/modules/push/push.service";
import type { SuscripcionPushInput } from "@/modules/push/push.types";

async function obtenerUsuarioSesion() {
  const cookieStore = await cookies();
  return obtenerUsuarioAutenticado(
    cookieStore.get("session_token")?.value,
  );
}

async function leerJson(request: Request): Promise<SuscripcionPushInput | null> {
  try {
    return (await request.json()) as SuscripcionPushInput;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const autenticacion = await obtenerUsuarioSesion();
    const usuario = autenticacion.body.data?.usuario;

    if (!usuario) {
      return Response.json(autenticacion.body, {
        status: autenticacion.status,
      });
    }

    const resultado = await consultarSuscripcionesPushService(
      usuario,
      request.headers.get("x-push-endpoint-hash") ?? undefined,
    );
    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error consultando suscripciones Push:", error);
    return Response.json(
      { ok: false, message: "No fue posible consultar las notificaciones." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const autenticacion = await obtenerUsuarioSesion();
    const usuario = autenticacion.body.data?.usuario;

    if (!usuario) {
      return Response.json(autenticacion.body, {
        status: autenticacion.status,
      });
    }

    const body = await leerJson(request);
    if (!body) {
      return Response.json(
        { ok: false, message: "El cuerpo de la solicitud debe ser un JSON válido." },
        { status: 400 },
      );
    }

    const resultado = await registrarSuscripcionPushService(
      usuario,
      body,
      request.headers.get("user-agent") ?? undefined,
    );
    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error registrando suscripción Push:", error);
    return Response.json(
      { ok: false, message: "No fue posible activar las notificaciones." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const autenticacion = await obtenerUsuarioSesion();
    const usuario = autenticacion.body.data?.usuario;

    if (!usuario) {
      return Response.json(autenticacion.body, {
        status: autenticacion.status,
      });
    }

    const body = await leerJson(request);
    if (!body) {
      return Response.json(
        { ok: false, message: "El cuerpo de la solicitud debe ser un JSON válido." },
        { status: 400 },
      );
    }

    const resultado = await desactivarSuscripcionPushService(usuario, body);
    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error desactivando suscripción Push:", error);
    return Response.json(
      { ok: false, message: "No fue posible desactivar las notificaciones." },
      { status: 500 },
    );
  }
}
