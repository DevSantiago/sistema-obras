import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, txMock } = vi.hoisted(() => {
  const tx = {
    eventos_webhook_whatsapp: {
      createMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    notificaciones_whatsapp: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  return {
    txMock: tx,
    prismaMock: {
      $transaction: vi.fn((callback) => callback(tx)),
    },
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { procesarEventoWebhookWhatsAppRepository } from "../whatsapp.repository";

const eventoBase = {
  claveEvento: "estado:clave",
  metaMensajeId: "wamid.123",
  tipoEvento: "ESTADO" as const,
  estadoMeta: "delivered",
  telefonoDestinatario: "573001112233",
  bsuidDestinatario: "CO.123456789",
  payload: { id: "wamid.123", status: "delivered", timestamp: "1787097600" },
};

describe("whatsapp.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txMock.eventos_webhook_whatsapp.createMany.mockResolvedValue({ count: 1 });
    txMock.eventos_webhook_whatsapp.findUniqueOrThrow.mockResolvedValue({
      id: "evento-id",
    });
    txMock.notificaciones_whatsapp.findUnique.mockResolvedValue({
      id: "notificacion-id",
    });
    txMock.notificaciones_whatsapp.update.mockResolvedValue({});
    txMock.notificaciones_whatsapp.updateMany.mockResolvedValue({ count: 1 });
    txMock.eventos_webhook_whatsapp.update.mockResolvedValue({});
  });

  it("ignora un evento ya registrado sin actualizar la notificación", async () => {
    txMock.eventos_webhook_whatsapp.createMany.mockResolvedValue({ count: 0 });

    await expect(
      procesarEventoWebhookWhatsAppRepository(eventoBase),
    ).resolves.toBe("DUPLICADO");
    expect(txMock.notificaciones_whatsapp.findUnique).not.toHaveBeenCalled();
  });

  it("marca como entregada y conserva el BSUID sin permitir regresiones", async () => {
    await expect(
      procesarEventoWebhookWhatsAppRepository(eventoBase),
    ).resolves.toBe("PROCESADO");

    expect(txMock.notificaciones_whatsapp.update).toHaveBeenCalledWith({
      where: { id: "notificacion-id" },
      data: { bsuid_destinatario: "CO.123456789" },
    });
    expect(txMock.notificaciones_whatsapp.updateMany).toHaveBeenCalledWith({
      where: {
        id: "notificacion-id",
        estado: { in: ["ENVIADA", "FALLIDA"] },
      },
      data: { estado: "ENTREGADA", ultimo_error: null },
    });
  });

  it("registra lectura y solo avanza desde estados anteriores", async () => {
    await procesarEventoWebhookWhatsAppRepository({
      ...eventoBase,
      estadoMeta: "read",
      payload: { status: "read", timestamp: "1787097601" },
    });

    expect(txMock.notificaciones_whatsapp.updateMany).toHaveBeenCalledWith({
      where: {
        id: "notificacion-id",
        estado: { in: ["ENVIADA", "FALLIDA", "ENTREGADA"] },
      },
      data: { estado: "LEIDA", ultimo_error: null },
    });
  });

  it("no convierte en fallida una notificación ya entregada o leída", async () => {
    await procesarEventoWebhookWhatsAppRepository({
      ...eventoBase,
      estadoMeta: "failed",
      payload: {
        status: "failed",
        timestamp: "1787097602",
        errors: [{ title: "Número no disponible" }],
      },
    });

    expect(txMock.notificaciones_whatsapp.updateMany).toHaveBeenCalledWith({
      where: {
        id: "notificacion-id",
        estado: { notIn: ["ENTREGADA", "LEIDA"] },
      },
      data: {
        estado: "FALLIDA",
        ultimo_error: "Número no disponible",
      },
    });
  });

  it("conserva el evento cuando no encuentra la notificación asociada", async () => {
    txMock.notificaciones_whatsapp.findUnique.mockResolvedValue(null);

    await expect(
      procesarEventoWebhookWhatsAppRepository(eventoBase),
    ).resolves.toBe("IGNORADO");
    expect(txMock.eventos_webhook_whatsapp.update).toHaveBeenCalledWith({
      where: { id: "evento-id" },
      data: expect.objectContaining({
        notificacion_id: undefined,
        resultado: "IGNORADO",
      }),
    });
  });
});
