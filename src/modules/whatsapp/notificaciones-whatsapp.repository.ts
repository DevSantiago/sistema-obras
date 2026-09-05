import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import type {
  CrearNotificacionesTransicionesInput,
  TransicionNotificableWhatsApp,
} from "./notificaciones-whatsapp.types";

export type DestinatarioNotificacion = {
  id: string;
  nombre: string;
  telefono: string | null;
};

function normalizarTelefonoDestinatario(telefono: string | null) {
  if (!telefono) {
    return null;
  }

  const soloDigitos = telefono.replace(/\D/g, "");

  if (!soloDigitos) {
    return null;
  }

  return soloDigitos.startsWith("57") ? soloDigitos : `57${soloDigitos}`;
}

export function tipoEventoNotificacion(
  estadoDestino: TransicionNotificableWhatsApp["estadoDestino"],
) {
  const eventos = {
    PENDIENTE_APROBADOR_1: "SOLICITUD_PENDIENTE_APROBADOR_1",
    PENDIENTE_APROBADOR_2: "SOLICITUD_PENDIENTE_APROBADOR_2",
    DEVUELTA_APROBADOR_1: "SOLICITUD_DEVUELTA_APROBADOR_1",
    DEVUELTA_SOLICITANTE: "SOLICITUD_DEVUELTA_SOLICITANTE",
    PROGRAMADA_PAGO: "SOLICITUD_PROGRAMADA_PAGO",
  } as const;

  return eventos[estadoDestino];
}

function plantillaEvento(estadoDestino: TransicionNotificableWhatsApp["estadoDestino"]) {
  const variables = {
    PENDIENTE_APROBADOR_1: "WHATSAPP_TEMPLATE_APROBACION_NIVEL_1",
    PENDIENTE_APROBADOR_2: "WHATSAPP_TEMPLATE_APROBACION_NIVEL_2",
    DEVUELTA_APROBADOR_1: "WHATSAPP_TEMPLATE_DEVOLUCION_APROBADOR_1",
    DEVUELTA_SOLICITANTE: "WHATSAPP_TEMPLATE_DEVOLUCION_SOLICITANTE",
    PROGRAMADA_PAGO: "WHATSAPP_TEMPLATE_PROGRAMADA_PAGO",
  } as const;

  return process.env[variables[estadoDestino]]?.trim() || null;
}

export function construirEnlaceSolicitud(
  solicitudId: string,
  estadoDestino: TransicionNotificableWhatsApp["estadoDestino"],
) {
  const base = process.env.APP_BASE_URL?.trim().replace(/\/$/, "");
  const ruta =
    estadoDestino === "PROGRAMADA_PAGO"
      ? "/pagos"
      : `/solicitudes-pago?solicitud_id=${encodeURIComponent(solicitudId)}`;

  return base ? `${base}${ruta}` : ruta;
}

async function obtenerAprobadores(
  tx: Prisma.TransactionClient,
  rol: "APROBADOR_1" | "APROBADOR_2",
  proyectoBaseId: string,
  lineaNegocio: string,
): Promise<DestinatarioNotificacion[]> {
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

export async function obtenerDestinatariosNotificacion(
  tx: Prisma.TransactionClient,
  transicion: TransicionNotificableWhatsApp,
  solicitud: {
    proyecto_base_id: string;
    creado_por: string | null;
    aprobado_1_por: string | null;
    centro_costo: { linea_negocio: string };
  },
): Promise<DestinatarioNotificacion[]> {
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

  if (transicion.estadoDestino === "PROGRAMADA_PAGO") {
    return tx.usuarios.findMany({
      where: {
        estado: "ACTIVO",
        roles: {
          some: {
            rol: {
              nombre: "PAGOS",
              activo: true,
            },
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

export async function crearNotificacionesWhatsAppTransicionesRepository(
  input: CrearNotificacionesTransicionesInput,
  tx: Prisma.TransactionClient,
) {
  if (process.env.WHATSAPP_ENABLED?.trim().toLowerCase() !== "true") {
    return { count: 0 };
  }

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
        aprobado_2_por: true,
        valor_neto: true,
        aprobador1: { select: { nombre: true } },
        aprobador2: { select: { nombre: true } },
        proyecto_base: { select: { nombre: true } },
        centro_costo: { select: { linea_negocio: true } },
        beneficiario: { select: { nombre: true } },
        proveedor: { select: { nombre: true } },
      },
    });
    const destinatarios = await obtenerDestinatariosNotificacion(
      tx,
      transicion,
      solicitud,
    );
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
        telefono_destinatario: normalizarTelefonoDestinatario(
          destinatario.telefono,
        ),
        ambiente: process.env.APP_ENV?.trim() || "development",
        tipo_evento: tipoEventoNotificacion(transicion.estadoDestino),
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
          aprobador_uno: solicitud.aprobador1?.nombre ?? "Sin registrar",
          aprobador_dos: solicitud.aprobador2?.nombre ?? "Sin registrar",
          enlace: construirEnlaceSolicitud(
            solicitud.id,
            transicion.estadoDestino,
          ),
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

export const crearNotificacionesTransicionesRepository =
  crearNotificacionesWhatsAppTransicionesRepository;
