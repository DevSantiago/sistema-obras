import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    suscripciones_push: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  desactivarSuscripcionPushRepository,
  registrarSuscripcionPushRepository,
} from "../push.repository";

describe("push.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.suscripciones_push.upsert.mockResolvedValue({});
    prismaMock.suscripciones_push.updateMany.mockResolvedValue({ count: 1 });
  });

  it("reactiva o reasigna un endpoint existente dentro del mismo ambiente", async () => {
    await registrarSuscripcionPushRepository({
      usuario_id: "usuario-1",
      ambiente: "staging",
      endpoint: "https://push.example.com/123",
      endpoint_hash: "hash-endpoint",
      clave_p256dh: "p256dh",
      clave_auth: "auth",
      agente_usuario: "Android",
    });

    expect(prismaMock.suscripciones_push.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          endpoint_hash_ambiente: {
            endpoint_hash: "hash-endpoint",
            ambiente: "staging",
          },
        },
        update: expect.objectContaining({
          usuario_id: "usuario-1",
          estado: "ACTIVA",
          revocado_en: null,
        }),
      }),
    );
  });

  it("limita la revocación al usuario propietario", async () => {
    await desactivarSuscripcionPushRepository({
      usuario_id: "usuario-1",
      ambiente: "production",
      endpoint_hash: "hash-endpoint",
    });

    expect(prismaMock.suscripciones_push.updateMany).toHaveBeenCalledWith({
      where: {
        usuario_id: "usuario-1",
        ambiente: "production",
        endpoint_hash: "hash-endpoint",
        estado: "ACTIVA",
      },
      data: {
        estado: "REVOCADA",
        endpoint: "",
        clave_p256dh: "",
        clave_auth: "",
        revocado_en: expect.any(Date),
      },
    });
  });
});
