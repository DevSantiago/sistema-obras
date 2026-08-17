import { beforeEach, describe, expect, it, vi } from "vitest";

const { recibirMock, verificarMock } = vi.hoisted(() => ({
  recibirMock: vi.fn(),
  verificarMock: vi.fn(),
}));

vi.mock("@/modules/whatsapp/whatsapp.service", () => {
  class ConfiguracionWhatsAppError extends Error {}

  return {
    ConfiguracionWhatsAppError,
    recibirWebhookWhatsAppService: recibirMock,
    verificarWebhookWhatsAppService: verificarMock,
  };
});

import { GET, POST } from "../route";

describe("/api/v1/webhooks/whatsapp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve el challenge aprobado por el servicio", async () => {
    verificarMock.mockReturnValue({ status: 200, challenge: "654321" });

    const response = await GET(
      new Request(
        "http://localhost/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=token&hub.challenge=654321",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("654321");
    expect(verificarMock).toHaveBeenCalledWith({
      mode: "subscribe",
      verifyToken: "token",
      challenge: "654321",
    });
  });

  it("entrega al servicio el cuerpo crudo y la firma", async () => {
    recibirMock.mockReturnValue({
      status: 200,
      body: { ok: true, message: "Recibido" },
    });
    const contenido = JSON.stringify({ entry: [] });

    const response = await POST(
      new Request("http://localhost/api/v1/webhooks/whatsapp", {
        method: "POST",
        headers: { "x-hub-signature-256": "sha256=firma" },
        body: contenido,
      }),
    );

    expect(response.status).toBe(200);
    expect(recibirMock).toHaveBeenCalledWith({
      contenido,
      firma: "sha256=firma",
    });
  });

  it("rechaza el cuerpo antes de procesarlo cuando supera el límite", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/webhooks/whatsapp", {
        method: "POST",
        headers: { "content-length": String(1024 * 1024 + 1) },
        body: "{}",
      }),
    );

    expect(response.status).toBe(413);
    expect(recibirMock).not.toHaveBeenCalled();
  });
});
