import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { EventoWebhookWhatsApp } from "./whatsapp.types";

const ESTADOS_CONFIRMADOS = ["ENVIADA", "ENTREGADA", "LEIDA"];

function fechaEvento(timestamp: unknown) {
  const segundos = Number(timestamp);
  const fecha = new Date(segundos * 1000);

  return Number.isFinite(segundos) && !Number.isNaN(fecha.getTime())
    ? fecha
    : new Date();
}

function mensajeError(payload: Record<string, unknown>) {
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  const primero = errors[0];

  if (primero && typeof primero === "object" && "title" in primero) {
    return String(primero.title).slice(0, 2000);
  }

  return "Meta informó que el mensaje no pudo ser entregado.";
}

async function actualizarNotificacion(
  tx: Prisma.TransactionClient,
  notificacionId: string,
  evento: EventoWebhookWhatsApp,
) {
  const fecha = fechaEvento(evento.payload.timestamp);

  if (evento.bsuidDestinatario) {
    await tx.notificaciones_whatsapp.update({
      where: { id: notificacionId },
      data: { bsuid_destinatario: evento.bsuidDestinatario },
    });
  }

  if (evento.estadoMeta === "sent") {
    await tx.notificaciones_whatsapp.updateMany({
      where: { id: notificacionId, enviado_en: null },
      data: { enviado_en: fecha },
    });
    return;
  }

  if (evento.estadoMeta === "delivered") {
    await tx.notificaciones_whatsapp.updateMany({
      where: { id: notificacionId, entregado_en: null },
      data: { entregado_en: fecha },
    });
    await tx.notificaciones_whatsapp.updateMany({
      where: { id: notificacionId, estado: { in: ["ENVIADA", "FALLIDA"] } },
      data: { estado: "ENTREGADA", ultimo_error: null },
    });
    return;
  }

  if (evento.estadoMeta === "read") {
    await tx.notificaciones_whatsapp.updateMany({
      where: { id: notificacionId, leido_en: null },
      data: { leido_en: fecha },
    });
    await tx.notificaciones_whatsapp.updateMany({
      where: {
        id: notificacionId,
        estado: { in: ["ENVIADA", "FALLIDA", "ENTREGADA"] },
      },
      data: { estado: "LEIDA", ultimo_error: null },
    });
    return;
  }

  if (evento.estadoMeta === "failed") {
    await tx.notificaciones_whatsapp.updateMany({
      where: { id: notificacionId, estado: { notIn: ESTADOS_CONFIRMADOS.slice(1) } },
      data: {
        estado: "FALLIDA",
        ultimo_error: mensajeError(evento.payload),
      },
    });
  }
}

export async function procesarEventoWebhookWhatsAppRepository(
  evento: EventoWebhookWhatsApp,
) {
  return prisma.$transaction(async (tx) => {
    const creado = await tx.eventos_webhook_whatsapp.createMany({
      data: {
        clave_evento: evento.claveEvento,
        meta_mensaje_id: evento.metaMensajeId,
        tipo_evento: evento.tipoEvento,
        estado_meta: evento.estadoMeta,
        telefono_destinatario: evento.telefonoDestinatario,
        bsuid_destinatario: evento.bsuidDestinatario,
        resultado: "RECIBIDO",
        payload: evento.payload as Prisma.InputJsonValue,
      },
      skipDuplicates: true,
    });

    if (creado.count === 0) {
      return "DUPLICADO" as const;
    }

    const registro = await tx.eventos_webhook_whatsapp.findUniqueOrThrow({
      where: { clave_evento: evento.claveEvento },
      select: { id: true },
    });
    const notificacion = evento.metaMensajeId
      ? await tx.notificaciones_whatsapp.findUnique({
          where: { meta_mensaje_id: evento.metaMensajeId },
          select: { id: true },
        })
      : null;
    const reconocido =
      evento.tipoEvento === "ESTADO" &&
      ["sent", "delivered", "read", "failed"].includes(
        evento.estadoMeta ?? "",
      );

    if (notificacion && reconocido) {
      await actualizarNotificacion(tx, notificacion.id, evento);
    }

    await tx.eventos_webhook_whatsapp.update({
      where: { id: registro.id },
      data: {
        notificacion_id: notificacion?.id,
        resultado: notificacion && reconocido ? "PROCESADO" : "IGNORADO",
        error:
          evento.tipoEvento === "ESTADO" && !notificacion
            ? "No existe una notificación asociada al identificador de Meta."
            : reconocido || evento.tipoEvento === "MENSAJE"
              ? null
              : "El evento recibido no corresponde a un estado reconocido.",
        procesado_en: new Date(),
      },
    });

    return notificacion && reconocido ? "PROCESADO" : "IGNORADO";
  });
}
