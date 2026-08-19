import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, updateManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  updateManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notificaciones_whatsapp: {
      findMany: findManyMock,
      updateMany: updateManyMock,
    },
  },
}));

import {
  obtenerNotificacionesProcesablesRepository,
  reclamarNotificacionRepository,
} from "../envio-notificaciones.repository";

describe("envio-notificaciones.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta pendientes, fallidas vencidas y envíos bloqueados", async () => {
    findManyMock.mockResolvedValue([]);
    const reintentarAntesDe = new Date("2026-08-18T12:00:00.000Z");
    const recuperarAntesDe = new Date("2026-08-18T11:55:00.000Z");

    await obtenerNotificacionesProcesablesRepository({
      limite: 10,
      maximoIntentos: 3,
      reintentarAntesDe,
      recuperarAntesDe,
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          meta_mensaje_id: null,
          intentos: { lt: 3 },
          OR: [
            { estado: "PENDIENTE" },
            { estado: "FALLIDA", actualizado_en: { lte: reintentarAntesDe } },
            { estado: "ENVIANDO", actualizado_en: { lte: recuperarAntesDe } },
          ],
        },
        take: 10,
      }),
    );
  });

  it("reclama el registro solo si conserva el estado, intento y fecha leídos", async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    const actualizadoEn = new Date("2026-08-18T12:00:00.000Z");
    const fechaIntento = new Date("2026-08-18T12:01:00.000Z");

    const reclamada = await reclamarNotificacionRepository(
      {
        id: "notificacion-1",
        telefono_destinatario: "573001111111",
        plantilla: "aprobacion_nivel_1",
        idioma: "es_CO",
        contenido: {},
        estado: "PENDIENTE",
        intentos: 0,
        actualizado_en: actualizadoEn,
      },
      3,
      fechaIntento,
    );

    expect(reclamada).toBe(true);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: {
        id: "notificacion-1",
        estado: "PENDIENTE",
        actualizado_en: actualizadoEn,
        meta_mensaje_id: null,
        AND: [{ intentos: 0 }, { intentos: { lt: 3 } }],
      },
      data: {
        estado: "ENVIANDO",
        intentos: { increment: 1 },
        ultimo_error: null,
        actualizado_en: fechaIntento,
      },
    });
  });

  it("informa que otro procesador reclamó primero el registro", async () => {
    updateManyMock.mockResolvedValue({ count: 0 });

    const reclamada = await reclamarNotificacionRepository(
      {
        id: "notificacion-1",
        telefono_destinatario: "573001111111",
        plantilla: "aprobacion_nivel_1",
        idioma: "es_CO",
        contenido: {},
        estado: "PENDIENTE",
        intentos: 0,
        actualizado_en: new Date(),
      },
      3,
      new Date(),
    );

    expect(reclamada).toBe(false);
  });
});
