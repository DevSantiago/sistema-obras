import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { storageService } from "@/modules/storage/storage.service";
import {
  consultarOperacionesEfectivoRepository,
  CorreccionOperacionEfectivoError,
  obtenerArchivoOperacionEfectivoRepository,
  ReingresoSobranteError,
  registrarReingresoSobranteRepository,
  registrarCorreccionOperacionEfectivoRepository,
} from "../operaciones-efectivo.repository";
import {
  consultarOperacionesEfectivoService,
  obtenerArchivoOperacionEfectivoService,
  registrarReingresoSobranteService,
  registrarCorreccionOperacionEfectivoService,
} from "../operaciones-efectivo.service";

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    guardarArchivo: vi.fn(),
    eliminarArchivo: vi.fn(),
  },
}));

vi.mock("../operaciones-efectivo.repository", () => ({
  calcularPendienteOperacionEfectivo: vi.fn(
    (sobrante: number, reintegrado: number, ajustes: Array<{ direccion: string; valor: number }>) =>
      Math.max(
        0,
        sobrante -
          reintegrado +
          ajustes.reduce(
            (total, ajuste) =>
              total +
              (ajuste.direccion === "INGRESO" ? -1 : 1) * ajuste.valor,
            0,
          ),
      ),
  ),
  consultarOperacionesEfectivoRepository: vi.fn(),
  CorreccionOperacionEfectivoError: class extends Error {},
  obtenerArchivoOperacionEfectivoRepository: vi.fn(),
  ReingresoSobranteError: class extends Error {},
  registrarReingresoSobranteRepository: vi.fn(),
  registrarCorreccionOperacionEfectivoRepository: vi.fn(),
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
    estado: "ACTIVA",
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
    reingresos: [],
    correcciones: [],
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
    vi.mocked(storageService.guardarArchivo).mockResolvedValue({
      nombre_archivo: "reingreso.pdf",
      nombre_bucket: "LOCAL",
      ruta_archivo: "storage/reingresos/reingreso.pdf",
      tipo_mime: "application/pdf",
      tamano_archivo: BigInt(7),
    });
    vi.mocked(
      registrarReingresoSobranteRepository,
    ).mockResolvedValue({
      id: "reingreso-1",
      referencia_sistema: "REI-PROYECTO-2026-000001",
      operacion_efectivo_id: "operacion-1",
      valor: 100000,
      pendiente_anterior: 200000,
      pendiente_nuevo: 100000,
      estado_seguimiento: "SOBRANTE_PENDIENTE_REINGRESO",
      saldo_fondo_anterior: 500000,
      saldo_fondo_nuevo: 600000,
      fecha_operacion: "2026-07-31T15:00:00.000Z",
    });
    vi.mocked(
      registrarCorreccionOperacionEfectivoRepository,
    ).mockResolvedValue({
      id: "correccion-1",
      referencia_sistema: "COR-PROYECTO-2026-000001",
      tipo: "AJUSTE",
      direccion: "INGRESO",
      valor: 50000,
      pendiente_anterior: 50000,
      pendiente_nuevo: 0,
      estado_operacion: "AJUSTADA",
      saldo_fondo_anterior: 500000,
      saldo_fondo_nuevo: 550000,
      registrado_en: "2026-07-31T15:00:00.000Z",
    });
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

  it("debe retornar únicamente operaciones con reingreso pendiente", async () => {
    vi.mocked(
      consultarOperacionesEfectivoRepository,
    ).mockResolvedValue([
      crearOperacion(),
      crearOperacion(200000),
    ] as never);

    const resultado = await consultarOperacionesEfectivoService(
      usuario,
      { solo_pendientes: true },
    );

    expect(resultado.body.data?.operaciones).toHaveLength(1);
    expect(
      resultado.body.data?.operaciones[0].estado_seguimiento,
    ).toBe("SOBRANTE_PENDIENTE_REINGRESO");
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

  it("debe registrar reingreso con soporte y fecha del sistema", async () => {
    const resultado = await registrarReingresoSobranteService(usuario, {
      operacion_efectivo_id: "operacion-1",
      valor: 100000,
      observacion: "Reingreso parcial",
      soporte: new File(["soporte"], "reingreso.pdf", {
        type: "application/pdf",
      }),
    });

    expect(resultado.status).toBe(201);
    expect(registrarReingresoSobranteRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        operacion_efectivo_id: "operacion-1",
        valor: 100000,
        fecha_operacion: expect.any(Date),
      }),
    );
  });

  it("debe eliminar el archivo cuando falla el reingreso", async () => {
    vi.mocked(
      registrarReingresoSobranteRepository,
    ).mockRejectedValue(
      new ReingresoSobranteError("El valor supera el pendiente."),
    );

    const resultado = await registrarReingresoSobranteService(usuario, {
      operacion_efectivo_id: "operacion-1",
      valor: 300000,
      soporte: new File(["soporte"], "reingreso.pdf", {
        type: "application/pdf",
      }),
    });

    expect(resultado.status).toBe(409);
    expect(storageService.eliminarArchivo).toHaveBeenCalledWith(
      "storage/reingresos/reingreso.pdf",
    );
  });

  it("debe registrar un ajuste con motivo, dirección y valor", async () => {
    const resultado =
      await registrarCorreccionOperacionEfectivoService(usuario, {
        operacion_efectivo_id: "operacion-1",
        tipo: "AJUSTE",
        direccion: "INGRESO",
        valor: 50000,
        motivo: "Corrección del valor retirado",
      });

    expect(resultado.status).toBe(201);
    expect(
      registrarCorreccionOperacionEfectivoRepository,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "AJUSTE",
        direccion: "INGRESO",
        valor: 50000,
        usuario_id: "pagos-1",
        fecha_operacion: expect.any(Date),
      }),
    );
  });

  it("debe permitir anular sin recibir valor manual", async () => {
    vi.mocked(
      registrarCorreccionOperacionEfectivoRepository,
    ).mockResolvedValue({
      id: "correccion-2",
      referencia_sistema: "COR-PROYECTO-2026-000002",
      tipo: "ANULACION",
      direccion: "INGRESO",
      valor: 800000,
      pendiente_anterior: null,
      pendiente_nuevo: null,
      estado_operacion: "ANULADA",
      saldo_fondo_anterior: 200000,
      saldo_fondo_nuevo: 1000000,
      registrado_en: "2026-07-31T15:00:00.000Z",
    });

    const resultado =
      await registrarCorreccionOperacionEfectivoService(usuario, {
        operacion_efectivo_id: "operacion-1",
        tipo: "ANULACION",
        motivo: "Operación duplicada",
      });

    expect(resultado.status).toBe(201);
    expect(resultado.body.data?.estado_operacion).toBe("ANULADA");
  });

  it("debe rechazar un ajuste sin valor", async () => {
    const resultado =
      await registrarCorreccionOperacionEfectivoService(usuario, {
        operacion_efectivo_id: "operacion-1",
        tipo: "AJUSTE",
        direccion: "EGRESO",
        motivo: "Diferencia",
      });

    expect(resultado.status).toBe(400);
    expect(
      registrarCorreccionOperacionEfectivoRepository,
    ).not.toHaveBeenCalled();
  });

  it("debe responder conflicto si la operación ya fue anulada", async () => {
    vi.mocked(
      registrarCorreccionOperacionEfectivoRepository,
    ).mockRejectedValue(
      new CorreccionOperacionEfectivoError(
        "La operación ya fue anulada.",
      ),
    );

    const resultado =
      await registrarCorreccionOperacionEfectivoService(usuario, {
        operacion_efectivo_id: "operacion-1",
        tipo: "ANULACION",
        motivo: "Duplicada",
      });

    expect(resultado.status).toBe(409);
  });
});
