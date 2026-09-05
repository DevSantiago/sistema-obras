import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/push/envio-push.service", () => ({
  ConfiguracionPushError: class ConfiguracionPushError extends Error {},
  procesarNotificacionesPushService: vi.fn(),
  tokenProcesadorPushValido: vi.fn(),
}));

import {
  procesarNotificacionesPushService,
  tokenProcesadorPushValido,
} from "@/modules/push/envio-push.service";
import { POST } from "../route";

describe("POST /api/v1/push/notificaciones/procesar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza solicitudes sin el token interno", async () => {
    vi.mocked(tokenProcesadorPushValido).mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost/api/v1/push/notificaciones/procesar", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(procesarNotificacionesPushService).not.toHaveBeenCalled();
  });

  it("procesa la cola cuando el token es válido", async () => {
    vi.mocked(tokenProcesadorPushValido).mockReturnValue(true);
    vi.mocked(procesarNotificacionesPushService).mockResolvedValue({
      revisadas: 1,
      enviadas: 1,
      fallidas: 0,
      omitidas: 0,
      suscripcionesDesactivadas: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/v1/push/notificaciones/procesar", {
        method: "POST",
        headers: { authorization: "Bearer token-interno" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: { enviadas: 1 },
    });
  });
});
