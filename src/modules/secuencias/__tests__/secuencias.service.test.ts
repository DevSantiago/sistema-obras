import { beforeEach, describe, expect, it, vi } from "vitest";
import { generarSecuenciaDocumentalRepository } from "../secuencias.repository";
import {
  generarNumeroSolicitudPagoService,
  generarSecuenciaDocumentalService,
} from "../secuencias.service";

vi.mock("../secuencias.repository", () => ({
  generarSecuenciaDocumentalRepository: vi.fn(),
}));

describe("secuencias.service - generarSecuenciaDocumentalService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe lanzar error si el tipo de secuencia no es válido", async () => {
    await expect(
      generarSecuenciaDocumentalService({
        tipo_secuencia: "CLIENTE" as never,
        anio: 2026,
      }),
    ).rejects.toThrow("El tipo de secuencia documental no es válido.");

    expect(generarSecuenciaDocumentalRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el año no es válido", async () => {
    await expect(
      generarSecuenciaDocumentalService({
        tipo_secuencia: "SOLICITUD_PAGO",
        anio: 1900,
      }),
    ).rejects.toThrow("El año de la secuencia documental no es válido.");

    expect(generarSecuenciaDocumentalRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si envía centro de costo sin proyecto base", async () => {
    await expect(
      generarSecuenciaDocumentalService({
        tipo_secuencia: "SOLICITUD_PAGO",
        centro_costo_id: "centro-1",
        anio: 2026,
      }),
    ).rejects.toThrow(
      "Para generar una secuencia por centro de costo debe indicar el proyecto base.",
    );

    expect(generarSecuenciaDocumentalRepository).not.toHaveBeenCalled();
  });

  it("debe generar secuencia global normalizada", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository).mockResolvedValue({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: null,
      centro_costo_id: null,
      clave_contexto: "GLOBAL",
      prefijo: "SOL",
      anio: 2026,
      valor: 1,
      referencia: "SOL-2026-000001",
    });

    const resultado = await generarSecuenciaDocumentalService({
      tipo_secuencia: "SOLICITUD_PAGO",
      anio: 2026,
    });

    expect(resultado.referencia).toBe("SOL-2026-000001");
    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: null,
      centro_costo_id: null,
      clave_contexto: "GLOBAL",
      prefijo: "SOL",
      anio: 2026,
    });
  });

  it("debe generar secuencia por proyecto", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository).mockResolvedValue({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: null,
      clave_contexto: "PROYECTO:proyecto-1",
      prefijo: "SOL",
      anio: 2026,
      valor: 7,
      referencia: "SOL-2026-000007",
    });

    const resultado = await generarSecuenciaDocumentalService({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: " proyecto-1 ",
      anio: 2026,
    });

    expect(resultado.referencia).toBe("SOL-2026-000007");
    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: null,
      clave_contexto: "PROYECTO:proyecto-1",
      prefijo: "SOL",
      anio: 2026,
    });
  });

  it("debe generar secuencia por centro de costo", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository).mockResolvedValue({
      tipo_secuencia: "MOVIMIENTO_FONDO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      clave_contexto: "CENTRO:proyecto-1:centro-1",
      prefijo: "MOV",
      anio: 2026,
      valor: 15,
      referencia: "MOV-2026-000015",
    });

    const resultado = await generarSecuenciaDocumentalService({
      tipo_secuencia: "MOVIMIENTO_FONDO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      anio: 2026,
    });

    expect(resultado.referencia).toBe("MOV-2026-000015");
    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "MOVIMIENTO_FONDO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      clave_contexto: "CENTRO:proyecto-1:centro-1",
      prefijo: "MOV",
      anio: 2026,
    });
  });

  it("debe permitir prefijo personalizado normalizado", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository).mockResolvedValue({
      tipo_secuencia: "CARGO_FINANCIERO",
      proyecto_base_id: null,
      centro_costo_id: null,
      clave_contexto: "GLOBAL",
      prefijo: "CF",
      anio: 2026,
      valor: 2,
      referencia: "CF-2026-000002",
    });

    const resultado = await generarSecuenciaDocumentalService({
      tipo_secuencia: "CARGO_FINANCIERO",
      prefijo: " cf ",
      anio: 2026,
    });

    expect(resultado.referencia).toBe("CF-2026-000002");
    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "CARGO_FINANCIERO",
      proyecto_base_id: null,
      centro_costo_id: null,
      clave_contexto: "GLOBAL",
      prefijo: "CF",
      anio: 2026,
    });
  });
});

describe("secuencias.service - generarNumeroSolicitudPagoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe generar número de solicitud de pago", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository).mockResolvedValue({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      clave_contexto: "CENTRO:proyecto-1:centro-1",
      prefijo: "SOL",
      anio: 2026,
      valor: 1,
      referencia: "SOL-2026-000001",
    });

    const resultado = await generarNumeroSolicitudPagoService({
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      anio: 2026,
    });

    expect(resultado.referencia).toBe("SOL-2026-000001");
    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      clave_contexto: "CENTRO:proyecto-1:centro-1",
      prefijo: "SOL",
      anio: 2026,
    });
  });
});