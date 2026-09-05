import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import {
  construirEnlaceSolicitud,
  obtenerDestinatariosNotificacion,
  tipoEventoNotificacion,
} from "@/modules/whatsapp/notificaciones-whatsapp.repository";
import type { CrearNotificacionesTransicionesInput } from "@/modules/whatsapp/notificaciones-whatsapp.types";

const MENSAJES_ESTADO = {
  PENDIENTE_APROBADOR_1: "Tienes una solicitud pendiente de aprobación nivel 1.",
  PENDIENTE_APROBADOR_2: "Tienes una solicitud pendiente de aprobación nivel 2.",
  DEVUELTA_APROBADOR_1: "Una solicitud requiere nuevamente tu revisión.",
  DEVUELTA_SOLICITANTE: "Una solicitud fue devuelta y requiere tu corrección.",
  PROGRAMADA_PAGO: "Una solicitud aprobada está disponible para procesar el pago.",
} as const;

export async function crearNotificacionesPushTransicionesRepository(
  input: CrearNotificacionesTransicionesInput,
  tx: Prisma.TransactionClient,
) {
  if (process.env.PUSH_ENABLED?.trim().toLowerCase() !== "true") {
    return { count: 0 };
  }

  const ambiente = process.env.APP_ENV?.trim() || "development";
  let cantidadCreada = 0;

  for (const transicion of input.transiciones) {
    const solicitud = await tx.solicitudes_pago.findUniqueOrThrow({
      where: { id: transicion.solicitudId },
      select: {
        id: true,
        proyecto_base_id: true,
        creado_por: true,
        aprobado_1_por: true,
        centro_costo: { select: { linea_negocio: true } },
      },
    });
    const destinatarios = await obtenerDestinatariosNotificacion(
      tx,
      transicion,
      solicitud,
    );
    const destinatariosIds = destinatarios.map((destinatario) => destinatario.id);

    if (destinatariosIds.length === 0) {
      continue;
    }

    const suscripciones = await tx.suscripciones_push.findMany({
      where: {
        usuario_id: { in: destinatariosIds },
        ambiente,
        estado: "ACTIVA",
      },
      select: { id: true, usuario_id: true },
    });

    if (suscripciones.length === 0) {
      continue;
    }

    const eventoTransicionId = randomUUID();
    const resultado = await tx.notificaciones_push.createMany({
      data: suscripciones.map((suscripcion) => ({
        evento_transicion_id: eventoTransicionId,
        solicitud_pago_id: solicitud.id,
        destinatario_usuario_id: suscripcion.usuario_id,
        suscripcion_push_id: suscripcion.id,
        ambiente,
        tipo_evento: tipoEventoNotificacion(transicion.estadoDestino),
        estado_origen: transicion.estadoOrigen,
        estado_destino: transicion.estadoDestino,
        titulo: "Sistema Obras",
        mensaje: MENSAJES_ESTADO[transicion.estadoDestino],
        enlace: construirEnlaceSolicitud(
          solicitud.id,
          transicion.estadoDestino,
        ),
        creado_en: input.fecha,
        actualizado_en: input.fecha,
      })),
      skipDuplicates: true,
    });

    cantidadCreada += resultado.count;
  }

  return { count: cantidadCreada };
}
