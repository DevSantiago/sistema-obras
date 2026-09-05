import { prisma } from "@/lib/prisma";

type RegistrarSuscripcionPushRepositoryInput = {
  usuario_id: string;
  ambiente: string;
  endpoint: string;
  endpoint_hash: string;
  clave_p256dh: string;
  clave_auth: string;
  agente_usuario?: string;
};

export async function registrarSuscripcionPushRepository(
  input: RegistrarSuscripcionPushRepositoryInput,
) {
  await prisma.suscripciones_push.upsert({
    where: {
      endpoint_hash_ambiente: {
        endpoint_hash: input.endpoint_hash,
        ambiente: input.ambiente,
      },
    },
    update: {
      usuario_id: input.usuario_id,
      endpoint: input.endpoint,
      clave_p256dh: input.clave_p256dh,
      clave_auth: input.clave_auth,
      agente_usuario: input.agente_usuario,
      estado: "ACTIVA",
      revocado_en: null,
    },
    create: {
      usuario_id: input.usuario_id,
      ambiente: input.ambiente,
      endpoint: input.endpoint,
      endpoint_hash: input.endpoint_hash,
      clave_p256dh: input.clave_p256dh,
      clave_auth: input.clave_auth,
      agente_usuario: input.agente_usuario,
    },
  });
}

export async function desactivarSuscripcionPushRepository(input: {
  usuario_id: string;
  ambiente: string;
  endpoint_hash: string;
}) {
  const resultado = await prisma.suscripciones_push.updateMany({
    where: {
      usuario_id: input.usuario_id,
      ambiente: input.ambiente,
      endpoint_hash: input.endpoint_hash,
      estado: "ACTIVA",
    },
    data: {
      estado: "REVOCADA",
      endpoint: "",
      clave_p256dh: "",
      clave_auth: "",
      revocado_en: new Date(),
    },
  });

  return resultado.count > 0;
}

export async function existeSuscripcionPushActivaRepository(input: {
  usuario_id: string;
  ambiente: string;
  endpoint_hash: string;
}) {
  const cantidad = await prisma.suscripciones_push.count({
    where: {
      usuario_id: input.usuario_id,
      ambiente: input.ambiente,
      endpoint_hash: input.endpoint_hash,
      estado: "ACTIVA",
    },
  });

  return cantidad > 0;
}

export async function contarSuscripcionesPushActivasRepository(
  usuarioId: string,
  ambiente: string,
) {
  return prisma.suscripciones_push.count({
    where: {
      usuario_id: usuarioId,
      ambiente,
      estado: "ACTIVA",
    },
  });
}
