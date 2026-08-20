import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { procesarEventoMock } = vi.hoisted(() => ({
  procesarEventoMock: vi.fn(),
}));

vi.mock("../whatsapp.repository", () => ({
  procesarEventoWebhookWhatsAppRepository: procesarEventoMock,
}));
import {
  ConfiguracionWhatsAppError,
  recibirWebhookWhatsAppService,
  verificarWebhookWhatsAppService,
} from "../whatsapp.service";

const appSecretOriginal = process.env.WHATSAPP_APP_SECRET;
const verifyTokenOriginal = process.env.WHATSAPP_VERIFY_TOKEN;
const enabledOriginal = process.env.WHATSAPP_ENABLED;

describe("whatsapp.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    procesarEventoMock.mockResolvedValue("IGNORADO");
    process.env.WHATSAPP_ENABLED = "true";
    process.env.WHATSAPP_APP_SECRET = "app-secret-pruebas";
    process.env.WHATSAPP_VERIFY_TOKEN = "verify-token-pruebas";
  });

  afterEach(() => {
    if (appSecretOriginal === undefined) {
      delete process.env.WHATSAPP_APP_SECRET;
    } else {
      process.env.WHATSAPP_APP_SECRET = appSecretOriginal;
    }

    if (verifyTokenOriginal === undefined) {
      delete process.env.WHATSAPP_VERIFY_TOKEN;
    } else {
      process.env.WHATSAPP_VERIFY_TOKEN = verifyTokenOriginal;
    }

    if (enabledOriginal === undefined) {
      delete process.env.WHATSAPP_ENABLED;
    } else {
      process.env.WHATSAPP_ENABLED = enabledOriginal;
    }
  });

  it("acepta la verificación enviada por Meta con el token correcto", () => {
    const resultado = verificarWebhookWhatsAppService({
      mode: "subscribe",
      verifyToken: "verify-token-pruebas",
      challenge: "123456",
    });

    expect(resultado).toEqual({ status: 200, challenge: "123456" });
  });

  it("rechaza la verificación cuando el token no coincide", () => {
    const resultado = verificarWebhookWhatsAppService({
      mode: "subscribe",
      verifyToken: "token-incorrecto",
      challenge: "123456",
    });

    expect(resultado.status).toBe(403);
  });

  it("acepta un evento cuya firma corresponde al cuerpo crudo", async () => {
    const contenido = JSON.stringify({ object: "whatsapp_business_account" });
    const firma = `sha256=${createHmac("sha256", "app-secret-pruebas")
      .update(contenido)
      .digest("hex")}`;

    const resultado = await recibirWebhookWhatsAppService({ contenido, firma });

    expect(resultado).toEqual({
      status: 200,
      body: {
        ok: true,
        message: "Webhook de WhatsApp recibido correctamente.",
        procesados: 0,
        duplicados: 0,
        ignorados: 1,
      },
    });
  });

  it("extrae estados con teléfono y BSUID para procesarlos de forma idempotente", async () => {
    procesarEventoMock.mockResolvedValue("PROCESADO");
    const contenido = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [
                  { wa_id: "573001112233", user_id: "CO.123456789" },
                ],
                statuses: [
                  {
                    id: "wamid.123",
                    status: "delivered",
                    timestamp: "1787097600",
                    recipient_id: "573001112233",
                    recipient_user_id: "CO.123456789",
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const firma = `sha256=${createHmac("sha256", "app-secret-pruebas")
      .update(contenido)
      .digest("hex")}`;

    const resultado = await recibirWebhookWhatsAppService({ contenido, firma });

    expect(resultado.body).toMatchObject({ procesados: 1, duplicados: 0 });
    expect(procesarEventoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metaMensajeId: "wamid.123",
        tipoEvento: "ESTADO",
        estadoMeta: "delivered",
        telefonoDestinatario: "573001112233",
        bsuidDestinatario: "CO.123456789",
      }),
    );
  });

  it("admite el BSUID de contacts en mensajes entrantes sin teléfono", async () => {
    const contenido = JSON.stringify({
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ user_id: "CO.987654321" }],
                messages: [
                  { id: "wamid.incoming", from_user_id: "CO.987654321" },
                ],
              },
            },
          ],
        },
      ],
    });
    const firma = `sha256=${createHmac("sha256", "app-secret-pruebas")
      .update(contenido)
      .digest("hex")}`;

    await recibirWebhookWhatsAppService({ contenido, firma });

    expect(procesarEventoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoEvento: "MENSAJE",
        telefonoDestinatario: null,
        bsuidDestinatario: "CO.987654321",
      }),
    );
  });

  it("rechaza el evento antes de procesarlo cuando la firma no es válida", async () => {
    const resultado = await recibirWebhookWhatsAppService({
      contenido: JSON.stringify({ object: "whatsapp_business_account" }),
      firma: `sha256=${"0".repeat(64)}`,
    });

    expect(resultado.status).toBe(401);
  });

  it("rechaza contenido inválido aunque tenga una firma válida", async () => {
    const contenido = "contenido-no-json";
    const firma = `sha256=${createHmac("sha256", "app-secret-pruebas")
      .update(contenido)
      .digest("hex")}`;

    const resultado = await recibirWebhookWhatsAppService({ contenido, firma });

    expect(resultado.status).toBe(400);
  });

  it("falla de forma explícita cuando faltan secretos del ambiente", () => {
    delete process.env.WHATSAPP_VERIFY_TOKEN;

    expect(() =>
      verificarWebhookWhatsAppService({
        mode: "subscribe",
        verifyToken: "token",
        challenge: "123",
      }),
    ).toThrow(ConfiguracionWhatsAppError);
  });
});
