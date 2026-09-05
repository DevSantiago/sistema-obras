import { beforeEach, describe, expect, it, vi } from "vitest";

const webpushMock = vi.hoisted(() => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock("web-push", () => ({ default: webpushMock }));
vi.mock("../envio-push.repository", () => ({
  desactivarSuscripcionPushExpiradaRepository: vi.fn(),
  marcarNotificacionPushEnviadaRepository: vi.fn(),
  marcarNotificacionPushFallidaRepository: vi.fn(),
  obtenerNotificacionesPushProcesablesRepository: vi.fn(),
  reclamarNotificacionPushRepository: vi.fn(),
}));

import {
  desactivarSuscripcionPushExpiradaRepository,
  marcarNotificacionPushEnviadaRepository,
  marcarNotificacionPushFallidaRepository,
  obtenerNotificacionesPushProcesablesRepository,
  reclamarNotificacionPushRepository,
} from "../envio-push.repository";
import { procesarNotificacionesPushService } from "../envio-push.service";

const notificacion = {
  id: "notificacion-1",
  solicitud_pago_id: "solicitud-1",
  tipo_evento: "SOLICITUD_PENDIENTE_APROBADOR_1",
  titulo: "Sistema Obras",
  mensaje: "Tienes una solicitud pendiente de aprobación nivel 1.",
  enlace: "/solicitudes-pago?solicitud_id=solicitud-1",
  estado: "PENDIENTE",
  intentos: 0,
  actualizado_en: new Date("2026-09-05T05:30:00.000Z"),
  suscripcion: {
    id: "suscripcion-1",
    endpoint: "https://push.example/suscripcion",
    clave_p256dh: "clave-publica",
    clave_auth: "clave-auth",
  },
};

describe("envio-push.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PUSH_ENABLED = "true";
    process.env.APP_ENV = "staging";
    process.env.WEB_PUSH_VAPID_SUBJECT = "https://stg.dimensiones.cloud";
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = "publica";
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = "privada";
    vi.mocked(obtenerNotificacionesPushProcesablesRepository).mockResolvedValue([
      notificacion,
    ]);
    vi.mocked(reclamarNotificacionPushRepository).mockResolvedValue(true);
    vi.mocked(desactivarSuscripcionPushExpiradaRepository).mockResolvedValue(1);
  });

  it("envía un contenido sin información financiera", async () => {
    webpushMock.sendNotification.mockResolvedValue({ statusCode: 201 });

    const resultado = await procesarNotificacionesPushService();

    expect(resultado.enviadas).toBe(1);
    const payload = JSON.parse(webpushMock.sendNotification.mock.calls[0][1]);
    expect(payload).toMatchObject({
      title: "Sistema Obras",
      body: "Tienes una solicitud pendiente de aprobación nivel 1.",
      data: { url: "/solicitudes-pago?solicitud_id=solicitud-1" },
    });
    expect(JSON.stringify(payload)).not.toMatch(/valor|beneficiario|cuenta/i);
    expect(marcarNotificacionPushEnviadaRepository).toHaveBeenCalled();
  });

  it("desactiva la suscripción cuando el proveedor responde 410", async () => {
    webpushMock.sendNotification.mockRejectedValue(
      Object.assign(new Error("Suscripción expirada"), { statusCode: 410 }),
    );

    const resultado = await procesarNotificacionesPushService();

    expect(resultado).toMatchObject({
      fallidas: 1,
      suscripcionesDesactivadas: 1,
    });
    expect(desactivarSuscripcionPushExpiradaRepository).toHaveBeenCalledWith(
      expect.objectContaining({ suscripcionId: "suscripcion-1" }),
    );
    expect(marcarNotificacionPushFallidaRepository).toHaveBeenCalledWith(
      expect.objectContaining({ id: "notificacion-1", statusCode: 410 }),
    );
  });
});
