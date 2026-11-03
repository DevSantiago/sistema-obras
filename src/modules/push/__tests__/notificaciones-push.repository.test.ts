import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/whatsapp/notificaciones-whatsapp.repository", () => ({
  construirEnlaceSolicitud: vi.fn(
    (id: string, estado: string) => `/${estado.toLowerCase()}?solicitud_id=${id}`,
  ),
  obtenerDestinatariosNotificacion: vi.fn(async () => [
    { id: "usuario-1", nombre: "Aprobador", telefono: "3001234567" },
  ]),
  tipoEventoNotificacion: vi.fn(
    (estado: string) => `SOLICITUD_${estado}`,
  ),
}));

import { crearNotificacionesPushTransicionesRepository } from "../notificaciones-push.repository";

type NotificacionPushCreada = Record<string, unknown>;

function txMock() {
  return {
    solicitudes_pago: {
      findUniqueOrThrow: vi.fn(async () => ({
        id: "sol-1",
        numero_solicitud: "SOL-2026-000001",
        proyecto_base_id: "proyecto-1",
        creado_por: "solicitante-1",
        aprobado_1_por: null,
        centro_costo: { linea_negocio: "OBRA" },
      })),
    },
    usuarios: {
      findMany: vi.fn(async () => [
        { id: "aprobador-1", nombre: "Aprobador Uno", telefono: null },
        { id: "aprobador-2", nombre: "Aprobador Dos", telefono: null },
      ]),
    },
    suscripciones_push: {
      findMany: vi.fn(async () => [
        { id: "suscripcion-1", usuario_id: "usuario-1" },
        { id: "suscripcion-2", usuario_id: "usuario-1" },
      ]),
    },
    notificaciones_push: {
      createMany: vi.fn(
        async (input: { data: NotificacionPushCreada[] }) => ({
          count: input.data.length,
        }),
      ),
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
    const datos = tx.notificaciones_push.createMany.mock.calls[0]?.[0].data;
    expect(datos).toBeDefined();
    expect(datos).toHaveLength(2);
    expect(datos[0]).toMatchObject({
      suscripcion_push_id: "suscripcion-1",
      destinatario_usuario_id: "usuario-1",
      titulo: "Solicitud SOL-2026-000001",
      mensaje: "Tienes una solicitud pendiente de aprobación nivel 1.",
      enlace: "/pendiente_aprobador_1?solicitud_id=sol-1",
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

  it("notifica a todos los aprobadores de nivel 1 con acceso cuando recibe una devolución", async () => {
    const tx = txMock();
    tx.suscripciones_push.findMany.mockResolvedValue([
      { id: "suscripcion-1", usuario_id: "aprobador-1" },
      { id: "suscripcion-2", usuario_id: "aprobador-2" },
    ]);

    await crearNotificacionesPushTransicionesRepository(
      {
        transiciones: [
          {
            solicitudId: "sol-1",
            estadoOrigen: "PENDIENTE_APROBADOR_2",
            estadoDestino: "DEVUELTA_APROBADOR_1",
          },
        ],
        fecha: new Date("2026-09-10T12:00:00.000Z"),
      },
      tx as never,
    );

    expect(tx.usuarios.findMany).toHaveBeenCalledWith({
      where: {
        estado: "ACTIVO",
        roles: { some: { rol: { nombre: "APROBADOR_1", activo: true } } },
        accesos_recibidos: {
          some: {
            proyecto_base_id: "proyecto-1",
            linea_negocio: "OBRA",
            activo: true,
          },
        },
      },
      select: { id: true, nombre: true, telefono: true },
    });
    expect(tx.suscripciones_push.findMany).toHaveBeenCalledWith({
      where: {
        usuario_id: { in: ["aprobador-1", "aprobador-2"] },
        ambiente: "staging",
        estado: "ACTIVA",
      },
      select: { id: true, usuario_id: true },
    });
    expect(tx.notificaciones_push.createMany.mock.calls[0]?.[0].data).toHaveLength(2);
  });

  it.each([
    ["PENDIENTE_APROBADOR_2", "DEVUELTA_APROBADOR_1"],
    ["DEVUELTA_APROBADOR_1", "PENDIENTE_APROBADOR_2"],
    ["PENDIENTE_APROBADOR_1", "DEVUELTA_SOLICITANTE"],
    ["DEVUELTA_SOLICITANTE", "PENDIENTE_APROBADOR_1"],
  ] as const)(
    "registra Push al regresar o reenviar una solicitud (%s → %s)",
    async (estadoOrigen, estadoDestino) => {
      const tx = txMock();

      await crearNotificacionesPushTransicionesRepository(
        {
          transiciones: [
            { solicitudId: "sol-1", estadoOrigen, estadoDestino },
          ],
          fecha: new Date("2026-09-10T12:00:00.000Z"),
        },
        tx as never,
      );

      const datos = tx.notificaciones_push.createMany.mock.calls[0]?.[0].data;
      expect(datos).toBeDefined();
      expect(datos).toHaveLength(2);
      expect(datos[0]).toMatchObject({
        tipo_evento: `SOLICITUD_${estadoDestino}`,
        estado_origen: estadoOrigen,
        estado_destino: estadoDestino,
        enlace: `/${estadoDestino.toLowerCase()}?solicitud_id=sol-1`,
      });
    },
  );
});
