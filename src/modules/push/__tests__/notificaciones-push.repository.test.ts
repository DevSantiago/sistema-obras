import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/whatsapp/notificaciones-whatsapp.repository", () => ({
  construirEnlaceSolicitud: vi.fn(() => "/solicitudes-pago?solicitud_id=sol-1"),
  obtenerDestinatariosNotificacion: vi.fn(async () => [
    { id: "usuario-1", nombre: "Aprobador", telefono: "3001234567" },
  ]),
  tipoEventoNotificacion: vi.fn(() => "SOLICITUD_PENDIENTE_APROBADOR_1"),
}));

import { crearNotificacionesPushTransicionesRepository } from "../notificaciones-push.repository";

function txMock() {
  return {
    solicitudes_pago: {
      findUniqueOrThrow: vi.fn(async () => ({
        id: "sol-1",
        proyecto_base_id: "proyecto-1",
        creado_por: "solicitante-1",
        aprobado_1_por: null,
        centro_costo: { linea_negocio: "OBRA" },
      })),
    },
    suscripciones_push: {
      findMany: vi.fn(async () => [
        { id: "suscripcion-1", usuario_id: "usuario-1" },
        { id: "suscripcion-2", usuario_id: "usuario-1" },
      ]),
    },
    notificaciones_push: {
      createMany: vi.fn(async () => ({ count: 2 })),
    },
  };
}

describe("notificaciones-push.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PUSH_ENABLED = "true";
    process.env.APP_ENV = "staging";
  });

  it("crea una notificación breve por cada dispositivo activo", async () => {
    const tx = txMock();
    const resultado = await crearNotificacionesPushTransicionesRepository(
      {
        transiciones: [
          {
            solicitudId: "sol-1",
            estadoOrigen: "BORRADOR",
            estadoDestino: "PENDIENTE_APROBADOR_1",
          },
        ],
        fecha: new Date("2026-09-05T05:30:00.000Z"),
      },
      tx as never,
    );

    expect(resultado).toEqual({ count: 2 });
    expect(tx.suscripciones_push.findMany).toHaveBeenCalledWith({
      where: {
        usuario_id: { in: ["usuario-1"] },
        ambiente: "staging",
        estado: "ACTIVA",
      },
      select: { id: true, usuario_id: true },
    });
    const datos = tx.notificaciones_push.createMany.mock.calls[0][0].data;
    expect(datos).toHaveLength(2);
    expect(datos[0]).toMatchObject({
      suscripcion_push_id: "suscripcion-1",
      destinatario_usuario_id: "usuario-1",
      titulo: "Sistema Obras",
      mensaje: "Tienes una solicitud pendiente de aprobación nivel 1.",
      enlace: "/solicitudes-pago?solicitud_id=sol-1",
    });
    expect(JSON.stringify(datos)).not.toMatch(/valor|beneficiario|cuenta/i);
  });

  it("no crea avisos cuando Push está deshabilitado", async () => {
    process.env.PUSH_ENABLED = "false";
    const tx = txMock();

    const resultado = await crearNotificacionesPushTransicionesRepository(
      { transiciones: [], fecha: new Date() },
      tx as never,
    );

    expect(resultado).toEqual({ count: 0 });
    expect(tx.notificaciones_push.createMany).not.toHaveBeenCalled();
  });
});
