import { createHash } from "node:crypto";
import type { ServiceResponse, UsuarioSesion } from "@/modules/auth/auth.types";
import {
  contarSuscripcionesPushActivasRepository,
  desactivarSuscripcionPushRepository,
  existeSuscripcionPushActivaRepository,
  registrarSuscripcionPushRepository,
} from "./push.repository";
import type {
  EstadoSuscripcionesPush,
  SuscripcionPushInput,
} from "./push.types";

function obtenerAmbiente() {
  return process.env.APP_ENV?.trim() || "development";
}

function calcularHashEndpoint(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex");
}

function validarEndpoint(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length > 4096) return null;

  try {
    const url = new URL(valor);
    return url.protocol === "https:" ? valor : null;
  } catch {
    return null;
  }
}

function validarClave(valor: unknown, longitudMaxima: number): string | null {
  if (
    typeof valor !== "string" ||
    valor.length === 0 ||
    valor.length > longitudMaxima ||
    !/^[A-Za-z0-9_-]+$/.test(valor)
  ) {
    return null;
  }

  return valor;
}

export async function consultarSuscripcionesPushService(
  usuario: UsuarioSesion,
  endpointHash?: string,
): Promise<ServiceResponse<EstadoSuscripcionesPush>> {
  const ambiente = obtenerAmbiente();
  const cantidadDispositivos = await contarSuscripcionesPushActivasRepository(
    usuario.id,
    ambiente,
  );
  const hashValido = /^[a-f0-9]{64}$/.test(endpointHash ?? "");
  const activaEnEsteDispositivo = hashValido
    ? await existeSuscripcionPushActivaRepository({
        usuario_id: usuario.id,
        ambiente,
        endpoint_hash: endpointHash!,
      })
    : false;

  return {
    status: 200,
    body: {
      ok: true,
      message: "Estado de notificaciones consultado.",
      data: {
        cantidad_dispositivos: cantidadDispositivos,
        activa_en_este_dispositivo: activaEnEsteDispositivo,
      },
    },
  };
}

export async function registrarSuscripcionPushService(
  usuario: UsuarioSesion,
  input: SuscripcionPushInput,
  agenteUsuario?: string,
): Promise<ServiceResponse<EstadoSuscripcionesPush>> {
  const endpoint = validarEndpoint(input.endpoint);
  const claveP256dh = validarClave(input.keys?.p256dh, 256);
  const claveAuth = validarClave(input.keys?.auth, 128);

  if (!endpoint || !claveP256dh || !claveAuth) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "La suscripción Push no es válida.",
      },
    };
  }

  const ambiente = obtenerAmbiente();
  await registrarSuscripcionPushRepository({
    usuario_id: usuario.id,
    ambiente,
    endpoint,
    endpoint_hash: calcularHashEndpoint(endpoint),
    clave_p256dh: claveP256dh,
    clave_auth: claveAuth,
    agente_usuario: agenteUsuario?.slice(0, 500),
  });

  const cantidadDispositivos = await contarSuscripcionesPushActivasRepository(
    usuario.id,
    ambiente,
  );

  return {
    status: 201,
    body: {
      ok: true,
      message: "Notificaciones activadas en este dispositivo.",
      data: {
        cantidad_dispositivos: cantidadDispositivos,
        activa_en_este_dispositivo: true,
      },
    },
  };
}

export async function desactivarSuscripcionPushService(
  usuario: UsuarioSesion,
  input: Pick<SuscripcionPushInput, "endpoint">,
): Promise<ServiceResponse<EstadoSuscripcionesPush>> {
  const endpoint = validarEndpoint(input.endpoint);

  if (!endpoint) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "La suscripción Push no es válida.",
      },
    };
  }

  const ambiente = obtenerAmbiente();
  await desactivarSuscripcionPushRepository({
    usuario_id: usuario.id,
    ambiente,
    endpoint_hash: calcularHashEndpoint(endpoint),
  });

  const cantidadDispositivos = await contarSuscripcionesPushActivasRepository(
    usuario.id,
    ambiente,
  );

  return {
    status: 200,
    body: {
      ok: true,
      message: "Notificaciones desactivadas en este dispositivo.",
      data: {
        cantidad_dispositivos: cantidadDispositivos,
        activa_en_este_dispositivo: false,
      },
    },
  };
}
