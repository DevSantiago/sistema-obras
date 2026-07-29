import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import {
  consultarOperacionesEfectivoRepository,
  obtenerArchivoOperacionEfectivoRepository,
} from "../operaciones-efectivo.repository";
import {
  consultarOperacionesEfectivoService,
  obtenerArchivoOperacionEfectivoService,
} from "../operaciones-efectivo.service";

vi.mock("../operaciones-efectivo.repository", () => ({
  consultarOperacionesEfectivoRepository: vi.fn(),
  obtenerArchivoOperacionEfectivoRepository: vi.fn(),
}));

const usuario: UsuarioSesion = {
  id: "pagos-1",
  nombre: "Pagos",
  correo: "pagos@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["PAGOS"],
  permisos: [],
};

const decimal = (valor: number) => ({ toNumber: () => valor });

function crearOperacion(valorReintegrado = 0) {
  return {
    id: "operacion-1",
    fecha_retiro: new Date("2026-07-30T15:00:00.000Z"),
    valor_requerido: decimal(800000),
    valor_retirado: decimal(1000000),
    valor_pagado: decimal(800000),
    valor_sobrante: decimal(200000),
    observacion: null,
    registrado_en: new Date("2026-07-30T15:00:00.000Z"),
    proyecto_base: { id: "proyecto-1", nombre: "Proyecto" },
    fondo: { id: "fondo-1", nombre: "Fondo general" },
    registrador: { nombre: "Pagos" },
    soporte_retiro: {
      id: "adjunto-retiro",
      nombre_archivo: "retiro.pdf",
      tipo_mime: "application/pdf",
    },
    movimientos:
      valorReintegrado > 0
        ? [{ valor: decimal(valorReintegrado) }]
        : [],
    detalles: [
      {
        id: "detalle-1",
        medio_pago: "EFECTIVO",
        valor_pagado: decimal(800000),
        numero_comprobante: null,
        observacion: null,
        solicitud_pago: {
          id: "solicitud-1",
          numero_solicitud: "SOL-001",
          tipo_solicitud: "PAGO_PROVEEDOR",
          beneficiario: { nombre: "Beneficiario" },
          centro_costo: { codigo: "OBRA-1", nombre: "Obra" },
        },
        soporte: {
          id: "adjunto-pago",
          nombre_archivo: "pago.pdf",
          tipo_mime: "application/pdf",
        },
      },
    ],
  };
}

describe("operaciones-efectivo.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe exigir un rol autorizado", async () => {
    const resultado = await consultarOperacionesEfectivoService(
      { ...usuario, roles: ["SOLICITANTE"] },
      {},
    );

    expect(resultado.status).toBe(403);
    expect(
      consultarOperacionesEfectivoRepository,
    ).not.toHaveBeenCalled();
  });

  it("debe identificar el sobrante pendiente", async () => {
    vi.mocked(
      consultarOperacionesEfectivoRepository,
    ).mockResolvedValue([crearOperacion()] as never);

    const resultado = await consultarOperacionesEfectivoService(
      usuario,
      {},
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.data?.operaciones[0]).toEqual(
      expect.objectContaining({
        valor_sobrante: 200000,
        valor_reintegrado: 0,
        valor_pendiente_reintegro: 200000,
        estado_seguimiento: "SOBRANTE_PENDIENTE_REINGRESO",
      }),
    );
    expect(resultado.body.data?.operaciones[0].detalles[0]).toEqual(
      expect.objectContaining({
        numero_solicitud: "SOL-001",
        beneficiario_nombre: "Beneficiario",
      }),
    );
  });

  it("debe identificar el sobrante totalmente reintegrado", async () => {
    vi.mocked(
      consultarOperacionesEfectivoRepository,
    ).mockResolvedValue([crearOperacion(200000)] as never);

    const resultado = await consultarOperacionesEfectivoService(
      usuario,
      {},
    );

    expect(
      resultado.body.data?.operaciones[0].estado_seguimiento,
    ).toBe("SOBRANTE_REINTEGRADO");
    expect(
      resultado.body.data?.operaciones[0]
        .valor_pendiente_reintegro,
    ).toBe(0);
  });

  it("debe rechazar un rango de fechas invertido", async () => {
    const resultado = await consultarOperacionesEfectivoService(
      usuario,
      {
        fecha_desde: "2026-07-31",
        fecha_hasta: "2026-07-01",
      },
    );

    expect(resultado.status).toBe(400);
  });

  it("debe validar que el soporte pertenezca a la operación", async () => {
    vi.mocked(
      obtenerArchivoOperacionEfectivoRepository,
    ).mockResolvedValue(null);

    const resultado = await obtenerArchivoOperacionEfectivoService(
      usuario,
      "operacion-1",
      "adjunto-ajeno",
    );

    expect(resultado.status).toBe(404);
  });
});
