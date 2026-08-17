import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

  it("acepta un evento cuya firma corresponde al cuerpo crudo", () => {
    const contenido = JSON.stringify({ object: "whatsapp_business_account" });
    const firma = `sha256=${createHmac("sha256", "app-secret-pruebas")
      .update(contenido)
      .digest("hex")}`;

    const resultado = recibirWebhookWhatsAppService({ contenido, firma });

    expect(resultado).toEqual({
      status: 200,
      body: {
        ok: true,
        message: "Webhook de WhatsApp recibido correctamente.",
      },
    });
  });

  it("rechaza el evento antes de procesarlo cuando la firma no es válida", () => {
    const resultado = recibirWebhookWhatsAppService({
      contenido: JSON.stringify({ object: "whatsapp_business_account" }),
      firma: `sha256=${"0".repeat(64)}`,
    });

    expect(resultado.status).toBe(401);
  });

  it("rechaza contenido inválido aunque tenga una firma válida", () => {
    const contenido = "contenido-no-json";
    const firma = `sha256=${createHmac("sha256", "app-secret-pruebas")
      .update(contenido)
      .digest("hex")}`;

    const resultado = recibirWebhookWhatsAppService({ contenido, firma });

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
