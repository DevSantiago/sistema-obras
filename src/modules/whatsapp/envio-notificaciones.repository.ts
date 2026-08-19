import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { NotificacionWhatsAppPendiente } from "./envio-notificaciones.types";

export async function obtenerNotificacionesProcesablesRepository(input: {
  limite: number;
  maximoIntentos: number;
  reintentarAntesDe: Date;
  recuperarAntesDe: Date;
}): Promise<NotificacionWhatsAppPendiente[]> {
  return prisma.notificaciones_whatsapp.findMany({
    where: {
      meta_mensaje_id: null,
      intentos: { lt: input.maximoIntentos },
      OR: [
        { estado: "PENDIENTE" },
        {
          estado: "FALLIDA",
          actualizado_en: { lte: input.reintentarAntesDe },
        },
        {
          estado: "ENVIANDO",
          actualizado_en: { lte: input.recuperarAntesDe },
        },
      ],
    },
    orderBy: { creado_en: "asc" },
    take: input.limite,
    select: {
      id: true,
      telefono_destinatario: true,
      plantilla: true,
      idioma: true,
      contenido: true,
      estado: true,
      intentos: true,
      actualizado_en: true,
    },
  });
}

export async function reclamarNotificacionRepository(
  notificacion: NotificacionWhatsAppPendiente,
  maximoIntentos: number,
  fecha: Date,
) {
  const resultado = await prisma.notificaciones_whatsapp.updateMany({
    where: {
      id: notificacion.id,
      estado: notificacion.estado,
      actualizado_en: notificacion.actualizado_en,
      meta_mensaje_id: null,
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

export async function marcarNotificacionEnviadaRepository(input: {
  id: string;
  metaMensajeId: string;
  respuesta: Prisma.InputJsonValue;
  fecha: Date;
}) {
  await prisma.notificaciones_whatsapp.updateMany({
    where: {
      id: input.id,
      estado: "ENVIANDO",
      meta_mensaje_id: null,
    },
    data: {
      estado: "ENVIADA",
      meta_mensaje_id: input.metaMensajeId,
      respuesta_proveedor: input.respuesta,
      ultimo_error: null,
      enviado_en: input.fecha,
      actualizado_en: input.fecha,
    },
  });
}

export async function marcarNotificacionFallidaRepository(input: {
  id: string;
  error: string;
  respuesta?: Prisma.InputJsonValue;
  fecha: Date;
}) {
  await prisma.notificaciones_whatsapp.updateMany({
    where: { id: input.id, estado: "ENVIANDO" },
    data: {
      estado: "FALLIDA",
      ultimo_error: input.error.slice(0, 2000),
      respuesta_proveedor: input.respuesta,
      actualizado_en: input.fecha,
    },
  });
}
