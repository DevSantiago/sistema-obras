import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { NotificacionPushPendiente } from "./envio-push.types";

export async function obtenerNotificacionesPushProcesablesRepository(input: {
  ambiente: string;
  limite: number;
  maximoIntentos: number;
  reintentarAntesDe: Date;
  recuperarAntesDe: Date;
}): Promise<NotificacionPushPendiente[]> {
  return prisma.notificaciones_push.findMany({
    where: {
      ambiente: input.ambiente,
      enviado_en: null,
      intentos: { lt: input.maximoIntentos },
      suscripcion: { estado: "ACTIVA", ambiente: input.ambiente },
      OR: [
        { estado: "PENDIENTE" },
        { estado: "FALLIDA", actualizado_en: { lte: input.reintentarAntesDe } },
        { estado: "ENVIANDO", actualizado_en: { lte: input.recuperarAntesDe } },
      ],
    },
    orderBy: { creado_en: "asc" },
    take: input.limite,
    select: {
      id: true,
      solicitud_pago_id: true,
      tipo_evento: true,
      titulo: true,
      mensaje: true,
      enlace: true,
      estado: true,
      intentos: true,
      actualizado_en: true,
      suscripcion: {
        select: {
          id: true,
          endpoint: true,
          clave_p256dh: true,
          clave_auth: true,
        },
      },
    },
  });
}

export async function reclamarNotificacionPushRepository(
  notificacion: NotificacionPushPendiente,
  maximoIntentos: number,
  fecha: Date,
) {
  const resultado = await prisma.notificaciones_push.updateMany({
    where: {
      id: notificacion.id,
      estado: notificacion.estado,
      actualizado_en: notificacion.actualizado_en,
      enviado_en: null,
      AND: [
        { intentos: notificacion.intentos },
        { intentos: { lt: maximoIntentos } },
      ],
    },
    data: {
      estado: "ENVIANDO",
      intentos: { increment: 1 },
      ultimo_error: null,
      actualizado_en: fecha,
    },
  });

  return resultado.count === 1;
}

export async function marcarNotificacionPushEnviadaRepository(input: {
  id: string;
  statusCode: number;
  fecha: Date;
}) {
  await prisma.notificaciones_push.updateMany({
    where: { id: input.id, estado: "ENVIANDO", enviado_en: null },
    data: {
      estado: "ENVIADA",
      ultimo_error: null,
      respuesta_proveedor: { status_code: input.statusCode },
      enviado_en: input.fecha,
      actualizado_en: input.fecha,
    },
  });
}

export async function marcarNotificacionPushFallidaRepository(input: {
  id: string;
  error: string;
  statusCode?: number;
  fecha: Date;
}) {
  const respuesta: Prisma.InputJsonValue | undefined = input.statusCode
    ? { status_code: input.statusCode }
    : undefined;

  await prisma.notificaciones_push.updateMany({
    where: { id: input.id, estado: "ENVIANDO" },
    data: {
      estado: "FALLIDA",
      ultimo_error: input.error.slice(0, 2000),
      respuesta_proveedor: respuesta,
      actualizado_en: input.fecha,
    },
  });
}

export async function desactivarSuscripcionPushExpiradaRepository(input: {
  suscripcionId: string;
  fecha: Date;
}) {
  const resultado = await prisma.suscripciones_push.updateMany({
    where: { id: input.suscripcionId, estado: "ACTIVA" },
    data: {
      endpoint: "",
      clave_p256dh: "",
      clave_auth: "",
      estado: "EXPIRADA",
      revocado_en: input.fecha,
      actualizado_en: input.fecha,
    },
  });

  return resultado.count;
}
