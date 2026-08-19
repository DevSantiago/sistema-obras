import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import type {
  CrearNotificacionesTransicionesInput,
  TransicionNotificableWhatsApp,
} from "./notificaciones-whatsapp.types";

type Destinatario = {
  id: string;
  nombre: string;
  telefono: string | null;
};

function tipoEvento(estadoDestino: TransicionNotificableWhatsApp["estadoDestino"]) {
  const eventos = {
    PENDIENTE_APROBADOR_1: "SOLICITUD_PENDIENTE_APROBADOR_1",
    PENDIENTE_APROBADOR_2: "SOLICITUD_PENDIENTE_APROBADOR_2",
    DEVUELTA_APROBADOR_1: "SOLICITUD_DEVUELTA_APROBADOR_1",
    DEVUELTA_SOLICITANTE: "SOLICITUD_DEVUELTA_SOLICITANTE",
  } as const;

  return eventos[estadoDestino];
}

function plantillaEvento(estadoDestino: TransicionNotificableWhatsApp["estadoDestino"]) {
  const variables = {
    PENDIENTE_APROBADOR_1: "WHATSAPP_TEMPLATE_APROBACION_NIVEL_1",
    PENDIENTE_APROBADOR_2: "WHATSAPP_TEMPLATE_APROBACION_NIVEL_2",
    DEVUELTA_APROBADOR_1: "WHATSAPP_TEMPLATE_DEVOLUCION_APROBADOR_1",
    DEVUELTA_SOLICITANTE: "WHATSAPP_TEMPLATE_DEVOLUCION_SOLICITANTE",
  } as const;

  return process.env[variables[estadoDestino]]?.trim() || null;
}

function construirEnlaceSolicitud(solicitudId: string) {
  const base = process.env.APP_BASE_URL?.trim().replace(/\/$/, "");
  const ruta = `/solicitudes-pago?solicitud_id=${encodeURIComponent(solicitudId)}`;

  return base ? `${base}${ruta}` : ruta;
}

async function obtenerAprobadores(
  tx: Prisma.TransactionClient,
  rol: "APROBADOR_1" | "APROBADOR_2",
  proyectoBaseId: string,
  lineaNegocio: string,
): Promise<Destinatario[]> {
  return tx.usuarios.findMany({
    where: {
      estado: "ACTIVO",
      roles: {
        some: {
          rol: {
            nombre: rol,
            activo: true,
          },
        },
      },
      accesos_recibidos: {
        some: {
          proyecto_base_id: proyectoBaseId,
          linea_negocio: lineaNegocio,
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

async function obtenerDestinatarios(
  tx: Prisma.TransactionClient,
  transicion: TransicionNotificableWhatsApp,
  solicitud: {
    proyecto_base_id: string;
    creado_por: string | null;
    aprobado_1_por: string | null;
    centro_costo: { linea_negocio: string };
  },
): Promise<Destinatario[]> {
  if (transicion.estadoDestino === "PENDIENTE_APROBADOR_1") {
    return obtenerAprobadores(
      tx,
      "APROBADOR_1",
      solicitud.proyecto_base_id,
      solicitud.centro_costo.linea_negocio,
    );
  }

  if (transicion.estadoDestino === "PENDIENTE_APROBADOR_2") {
    return obtenerAprobadores(
      tx,
      "APROBADOR_2",
      solicitud.proyecto_base_id,
      solicitud.centro_costo.linea_negocio,
    );
  }

  const destinatarioId =
    transicion.estadoDestino === "DEVUELTA_APROBADOR_1"
      ? solicitud.aprobado_1_por
      : solicitud.creado_por;

  if (!destinatarioId) {
    return [];
  }

  return tx.usuarios.findMany({
    where: {
      id: destinatarioId,
      estado: "ACTIVO",
    },
    select: {
      id: true,
      nombre: true,
      telefono: true,
    },
  });
}

export async function crearNotificacionesTransicionesRepository(
  input: CrearNotificacionesTransicionesInput,
  tx: Prisma.TransactionClient,
) {
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
        valor_neto: true,
        proyecto_base: { select: { nombre: true } },
        centro_costo: { select: { linea_negocio: true } },
        beneficiario: { select: { nombre: true } },
        proveedor: { select: { nombre: true } },
      },
    });
    const destinatarios = await obtenerDestinatarios(tx, transicion, solicitud);
    const eventoTransicionId = randomUUID();

    if (destinatarios.length === 0) {
      continue;
    }

    const resultado = await tx.notificaciones_whatsapp.createMany({
      data: destinatarios.map((destinatario) => ({
        evento_transicion_id: eventoTransicionId,
        solicitud_pago_id: solicitud.id,
        destinatario_usuario_id: destinatario.id,
        destinatario_nombre: destinatario.nombre,
        telefono_destinatario: destinatario.telefono,
        ambiente: process.env.APP_ENV?.trim() || "development",
        tipo_evento: tipoEvento(transicion.estadoDestino),
        estado_origen: transicion.estadoOrigen,
        estado_destino: transicion.estadoDestino,
        plantilla: plantillaEvento(transicion.estadoDestino),
        idioma: process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "es_CO",
        contenido: {
          solicitud_id: solicitud.id,
          numero_solicitud: solicitud.numero_solicitud,
          proyecto: solicitud.proyecto_base.nombre,
          beneficiario:
            solicitud.beneficiario?.nombre ??
            solicitud.proveedor?.nombre ??
            "Sin beneficiario",
          valor: Number(solicitud.valor_neto),
          estado_nuevo: transicion.estadoDestino,
          enlace: construirEnlaceSolicitud(solicitud.id),
        },
        creado_en: input.fecha,
        actualizado_en: input.fecha,
      })),
      skipDuplicates: true,
    });

    cantidadCreada += resultado.count;
  }

  return { count: cantidadCreada };
}
