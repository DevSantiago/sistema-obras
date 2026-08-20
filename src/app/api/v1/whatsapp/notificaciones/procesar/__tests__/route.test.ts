import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/whatsapp/envio-notificaciones.service", () => ({
  tokenProcesadorWhatsAppValido: vi.fn(),
  procesarNotificacionesWhatsAppService: vi.fn(),
}));

import {
  procesarNotificacionesWhatsAppService,
  tokenProcesadorWhatsAppValido,
} from "@/modules/whatsapp/envio-notificaciones.service";
import { POST } from "../route";

describe("POST /api/v1/whatsapp/notificaciones/procesar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza solicitudes sin token interno válido", async () => {
    vi.mocked(tokenProcesadorWhatsAppValido).mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost/api/v1/whatsapp/notificaciones/procesar", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(procesarNotificacionesWhatsAppService).not.toHaveBeenCalled();
  });

  it("procesa la cola cuando el token es válido", async () => {
    vi.mocked(tokenProcesadorWhatsAppValido).mockReturnValue(true);
    vi.mocked(procesarNotificacionesWhatsAppService).mockResolvedValue({
      revisadas: 2,
      enviadas: 1,
      fallidas: 1,
      omitidas: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/v1/whatsapp/notificaciones/procesar", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      revisadas: 2,
      enviadas: 1,
      fallidas: 1,
      omitidas: 0,
    });
  });
});
