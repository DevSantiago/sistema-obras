import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../envio-notificaciones.repository", () => ({
  obtenerNotificacionesProcesablesRepository: vi.fn(),
  reclamarNotificacionRepository: vi.fn(),
  marcarNotificacionEnviadaRepository: vi.fn(),
  marcarNotificacionFallidaRepository: vi.fn(),
}));

import {
  marcarNotificacionEnviadaRepository,
  marcarNotificacionFallidaRepository,
  obtenerNotificacionesProcesablesRepository,
  reclamarNotificacionRepository,
} from "../envio-notificaciones.repository";
import {
  procesarNotificacionesWhatsAppService,
  tokenProcesadorWhatsAppValido,
} from "../envio-notificaciones.service";

const variablesOriginales = { ...process.env };

function notificacion(overrides: Record<string, unknown> = {}) {
  return {
    id: "notificacion-1",
    destinatario_nombre: "Aprobador Uno",
    telefono_destinatario: "573001111111",
    plantilla: "aprobacion_nivel_1",
    idioma: "es_CO",
    contenido: {
      numero_solicitud: "SOL-2026-000001",
      proyecto: "Proyecto prueba",
      beneficiario: "Beneficiario prueba",
      valor: 250000,
      estado_nuevo: "PENDIENTE_APROBADOR_1",
      enlace: "https://stg.dimensiones.cloud/solicitudes-pago",
      aprobador_uno: "Aprobador Uno",
      aprobador_dos: "Aprobador Dos",
    },
    estado_destino: "PENDIENTE_APROBADOR_1",
    estado: "PENDIENTE",
    intentos: 0,
    actualizado_en: new Date("2026-08-18T12:00:00.000Z"),
    ...overrides,
  };
}

describe("envio-notificaciones.service", () => {
  beforeEach(() => {
    process.env.WHATSAPP_ENABLED = "true";
    process.env.WHATSAPP_GRAPH_API_VERSION = "v25.0";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "phone-number-id";
    process.env.WHATSAPP_ACCESS_TOKEN = "access-token";
    process.env.WHATSAPP_PROCESSOR_TOKEN = "processor-token";
    vi.mocked(obtenerNotificacionesProcesablesRepository).mockResolvedValue([
      notificacion(),
    ] as never);
    vi.mocked(reclamarNotificacionRepository).mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = { ...variablesOriginales };
    vi.clearAllMocks();
  });

  it("envía una plantilla y registra el identificador entregado por Meta", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [{ id: "wamid.123" }] }), {
        status: 200,
      }),
    );

    const resultado = await procesarNotificacionesWhatsAppService(
      fetchMock as typeof fetch,
    );

    expect(resultado).toEqual({
      revisadas: 1,
      enviadas: 1,
      fallidas: 0,
      omitidas: 0,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://graph.facebook.com/v25.0/phone-number-id/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toBe("573001111111");
    expect(body.template.components[0]).toEqual({
      type: "header",
      parameters: [
        {
          type: "text",
          parameter_name: "destinatario",
          text: "Aprobador Uno",
        },
      ],
    });
    expect(body.template.components[1].parameters).toHaveLength(5);
    expect(body.template.components[1].parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          parameter_name: "numero_solicitud",
          text: "SOL-2026-000001",
        }),
        expect.objectContaining({
          parameter_name: "valor",
          text: expect.stringContaining("250.000"),
        }),
        expect.objectContaining({
          parameter_name: "estado",
          text: "PENDIENTE APROBADOR 1",
        }),
      ]),
    );
    expect(marcarNotificacionEnviadaRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "notificacion-1",
        metaMensajeId: "wamid.123",
      }),
    );
  });

  it("registra el fallo del proveedor para permitir un reintento posterior", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: "Plantilla no encontrada" } }),
        { status: 400 },
      ),
    );

    const resultado = await procesarNotificacionesWhatsAppService(
      fetchMock as typeof fetch,
    );

    expect(resultado.fallidas).toBe(1);
    expect(marcarNotificacionFallidaRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "notificacion-1",
        error: "Plantilla no encontrada",
      }),
    );
    expect(marcarNotificacionEnviadaRepository).not.toHaveBeenCalled();
  });

  it("envía los dos aprobadores en la plantilla destinada a PAGOS", async () => {
    vi.mocked(obtenerNotificacionesProcesablesRepository).mockResolvedValue([
      notificacion({
        plantilla: "solicitud_programada_pago",
        estado_destino: "PROGRAMADA_PAGO",
      }),
    ] as never);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [{ id: "wamid.pagos" }] }), {
        status: 200,
      }),
    );

    await procesarNotificacionesWhatsAppService(fetchMock as typeof fetch);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.template.components[1].parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          parameter_name: "aprobador_uno",
          text: "Aprobador Uno",
        }),
        expect.objectContaining({
          parameter_name: "aprobador_dos",
          text: "Aprobador Dos",
        }),
      ]),
    );
  });

  it("no duplica una notificación reclamada por otro procesador", async () => {
    vi.mocked(reclamarNotificacionRepository).mockResolvedValue(false);
    const fetchMock = vi.fn();

    const resultado = await procesarNotificacionesWhatsAppService(
      fetchMock as typeof fetch,
    );

    expect(resultado.omitidas).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("marca como fallida una notificación sin teléfono", async () => {
    vi.mocked(obtenerNotificacionesProcesablesRepository).mockResolvedValue([
      notificacion({ telefono_destinatario: null }),
    ] as never);

    const resultado = await procesarNotificacionesWhatsAppService(vi.fn());

    expect(resultado.fallidas).toBe(1);
    expect(marcarNotificacionFallidaRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "El destinatario no tiene un teléfono configurado.",
      }),
    );
  });

  it("valida el token interno sin comparación insegura", () => {
    expect(tokenProcesadorWhatsAppValido("processor-token")).toBe(true);
    expect(tokenProcesadorWhatsAppValido("otro-token")).toBe(false);
    expect(tokenProcesadorWhatsAppValido(null)).toBe(false);
  });
});
