import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import {
  construirEnlaceSolicitud,
  obtenerDestinatariosNotificacion,
  tipoEventoNotificacion,
  type DestinatarioNotificacion,
} from "@/modules/whatsapp/notificaciones-whatsapp.repository";
import type {
  CrearNotificacionesTransicionesInput,
  TransicionNotificableWhatsApp,
} from "@/modules/whatsapp/notificaciones-whatsapp.types";

const MENSAJES_ESTADO = {
  PENDIENTE_APROBADOR_1: "Tienes una solicitud pendiente de aprobación nivel 1.",
  PENDIENTE_APROBADOR_2: "Tienes una solicitud pendiente de aprobación nivel 2.",
  DEVUELTA_APROBADOR_1: "Una solicitud requiere nuevamente tu revisión.",
  DEVUELTA_SOLICITANTE: "Una solicitud fue devuelta y requiere tu corrección.",
  PROGRAMADA_PAGO: "Una solicitud aprobada está disponible para procesar el pago.",
} as const;

async function obtenerDestinatariosPush(
  tx: Prisma.TransactionClient,
  transicion: TransicionNotificableWhatsApp,
  solicitud: {
    proyecto_base_id: string;
    creado_por: string | null;
    aprobado_1_por: string | null;
    centro_costo: { linea_negocio: string };
  },
): Promise<DestinatarioNotificacion[]> {
  if (transicion.estadoDestino === "DEVUELTA_APROBADOR_1") {
    return tx.usuarios.findMany({
      where: {
        estado: "ACTIVO",
        roles: {
          some: {
            rol: {
              nombre: "APROBADOR_1",
              activo: true,
            },
          },
        },
        accesos_recibidos: {
          some: {
            proyecto_base_id: solicitud.proyecto_base_id,
            linea_negocio: solicitud.centro_costo.linea_negocio,
            activo: true,
          },
        },
      },
      select: {
        id: true,
        nombre: true,
        telefono: true,
      },
    });
  }

  return obtenerDestinatariosNotificacion(tx, transicion, solicitud);
}

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
        numero_solicitud: true,
        proyecto_base_id: true,
        creado_por: true,
        aprobado_1_por: true,
        centro_costo: { select: { linea_negocio: true } },
      },
    });
    const destinatarios = await obtenerDestinatariosPush(
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
        titulo: `Solicitud ${solicitud.numero_solicitud}`,
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
