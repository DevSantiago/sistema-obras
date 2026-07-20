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
        centro_costo_referencia: "PRO-OBRA",
        anio: 2026,
      }),
    ).rejects.toThrow(
      "Para generar una secuencia por centro de costo debe indicar el proyecto base.",
    );

    expect(generarSecuenciaDocumentalRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si envía proyecto sin referencia visible", async () => {
    await expect(
      generarSecuenciaDocumentalService({
        tipo_secuencia: "SOLICITUD_PAGO",
        proyecto_base_id: "proyecto-1",
        anio: 2026,
      }),
    ).rejects.toThrow(
      "Para generar una secuencia por proyecto debe indicar la referencia visible del proyecto.",
    );

    expect(generarSecuenciaDocumentalRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si envía centro de costo sin referencia visible", async () => {
    await expect(
      generarSecuenciaDocumentalService({
        tipo_secuencia: "SOLICITUD_PAGO",
        proyecto_base_id: "proyecto-1",
        centro_costo_id: "centro-1",
        proyecto_referencia: "HUMAPO",
        anio: 2026,
      }),
    ).rejects.toThrow(
      "Para generar una secuencia por centro de costo debe indicar la referencia visible del centro de costo.",
    );

    expect(generarSecuenciaDocumentalRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si envía referencia de proyecto sin proyecto base", async () => {
    await expect(
      generarSecuenciaDocumentalService({
        tipo_secuencia: "ANTICIPO",
        proyecto_referencia: "HUMAPO",
        anio: 2026,
      }),
    ).rejects.toThrow(
      "No puede indicar una referencia de proyecto sin el identificador del proyecto base.",
    );

    expect(generarSecuenciaDocumentalRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si envía referencia de centro sin centro de costo", async () => {
    await expect(
      generarSecuenciaDocumentalService({
        tipo_secuencia: "SOLICITUD_PAGO",
        proyecto_base_id: "proyecto-1",
        proyecto_referencia: "HUMAPO",
        centro_costo_referencia: "PRO-OBRA",
        anio: 2026,
      }),
    ).rejects.toThrow(
      "No puede indicar una referencia de centro de costo sin el identificador del centro de costo.",
    );

    expect(generarSecuenciaDocumentalRepository).not.toHaveBeenCalled();
  });

  it("debe generar secuencia global normalizada", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository).mockResolvedValue({
      tipo_secuencia: "CONFIRMACION_PAGO",
      proyecto_base_id: null,
      centro_costo_id: null,
      clave_contexto: "GLOBAL",
      prefijo: "PAG",
      proyecto_referencia: null,
      centro_costo_referencia: null,
      anio: 2026,
      valor: 1,
      referencia: "PAG-2026-000001",
    });

    const resultado = await generarSecuenciaDocumentalService({
      tipo_secuencia: "CONFIRMACION_PAGO",
      anio: 2026,
    });

    expect(resultado.referencia).toBe("PAG-2026-000001");

    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "CONFIRMACION_PAGO",
      proyecto_base_id: null,
      centro_costo_id: null,
      proyecto_referencia: null,
      centro_costo_referencia: null,
      clave_contexto: "GLOBAL",
      prefijo: "PAG",
      anio: 2026,
    });
  });

  it("debe generar secuencia por proyecto", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository).mockResolvedValue({
      tipo_secuencia: "ANTICIPO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: null,
      clave_contexto: "PROYECTO:proyecto-1",
      prefijo: "ANT",
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: null,
      anio: 2026,
      valor: 7,
      referencia: "ANT-HUMAPO-2026-000007",
    });

    const resultado = await generarSecuenciaDocumentalService({
      tipo_secuencia: "ANTICIPO",
      proyecto_base_id: " proyecto-1 ",
      proyecto_referencia: " humapo ",
      anio: 2026,
    });

    expect(resultado.referencia).toBe("ANT-HUMAPO-2026-000007");

    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "ANTICIPO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: null,
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: null,
      clave_contexto: "PROYECTO:proyecto-1",
      prefijo: "ANT",
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
      proyecto_referencia: "LOMA-LINDA",
      centro_costo_referencia: "PRO-OBRA",
      anio: 2026,
      valor: 15,
      referencia: "MOV-PRO-OBRA-LOMA-LINDA-2026-000015",
    });

    const resultado = await generarSecuenciaDocumentalService({
      tipo_secuencia: "MOVIMIENTO_FONDO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      proyecto_referencia: " Loma Linda ",
      centro_costo_referencia: " Pro Obra ",
      anio: 2026,
    });

    expect(resultado.referencia).toBe(
      "MOV-PRO-OBRA-LOMA-LINDA-2026-000015",
    );

    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "MOVIMIENTO_FONDO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      proyecto_referencia: "LOMA-LINDA",
      centro_costo_referencia: "PRO-OBRA",
      clave_contexto: "CENTRO:proyecto-1:centro-1",
      prefijo: "MOV",
      anio: 2026,
    });
  });

  it("debe normalizar tildes y caracteres especiales en referencias visibles", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository).mockResolvedValue({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      clave_contexto: "CENTRO:proyecto-1:centro-1",
      prefijo: "SOL",
      proyecto_referencia: "CONSTRUCCION-ACACIAS",
      centro_costo_referencia: "PRO-INT",
      anio: 2026,
      valor: 3,
      referencia: "SOL-PRO-INT-CONSTRUCCION-ACACIAS-2026-000003",
    });

    const resultado = await generarSecuenciaDocumentalService({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      proyecto_referencia: " Construcción Acacías ",
      centro_costo_referencia: " PRO INT ",
      anio: 2026,
    });

    expect(resultado.referencia).toBe(
      "SOL-PRO-INT-CONSTRUCCION-ACACIAS-2026-000003",
    );

    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      proyecto_referencia: "CONSTRUCCION-ACACIAS",
      centro_costo_referencia: "PRO-INT",
      clave_contexto: "CENTRO:proyecto-1:centro-1",
      prefijo: "SOL",
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
      proyecto_referencia: null,
      centro_costo_referencia: null,
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
      proyecto_referencia: null,
      centro_costo_referencia: null,
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

  it("debe generar número de solicitud de pago por proyecto y centro de costo", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository).mockResolvedValue({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      clave_contexto: "CENTRO:proyecto-1:centro-1",
      prefijo: "SOL",
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: "PRO-OBRA",
      anio: 2026,
      valor: 1,
      referencia: "SOL-PRO-OBRA-HUMAPO-2026-000001",
    });

    const resultado = await generarNumeroSolicitudPagoService({
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      proyecto_referencia: "Humapo",
      centro_costo_referencia: "PRO-OBRA",
      anio: 2026,
    });

    expect(resultado.referencia).toBe(
      "SOL-PRO-OBRA-HUMAPO-2026-000001",
    );

    expect(generarSecuenciaDocumentalRepository).toHaveBeenCalledWith({
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: "PRO-OBRA",
      clave_contexto: "CENTRO:proyecto-1:centro-1",
      prefijo: "SOL",
      anio: 2026,
    });
  });

  it("debe generar consecutivos independientes para centros de costo diferentes", async () => {
    vi.mocked(generarSecuenciaDocumentalRepository)
      .mockResolvedValueOnce({
        tipo_secuencia: "SOLICITUD_PAGO",
        proyecto_base_id: "proyecto-1",
        centro_costo_id: "centro-pro-obra",
        clave_contexto: "CENTRO:proyecto-1:centro-pro-obra",
        prefijo: "SOL",
        proyecto_referencia: "HUMAPO",
        centro_costo_referencia: "PRO-OBRA",
        anio: 2026,
        valor: 1,
        referencia: "SOL-PRO-OBRA-HUMAPO-2026-000001",
      })
      .mockResolvedValueOnce({
        tipo_secuencia: "SOLICITUD_PAGO",
        proyecto_base_id: "proyecto-1",
        centro_costo_id: "centro-obra",
        clave_contexto: "CENTRO:proyecto-1:centro-obra",
        prefijo: "SOL",
        proyecto_referencia: "HUMAPO",
        centro_costo_referencia: "OBRA",
        anio: 2026,
        valor: 1,
        referencia: "SOL-OBRA-HUMAPO-2026-000001",
      });

    const secuenciaProObra = await generarNumeroSolicitudPagoService({
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-pro-obra",
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: "PRO-OBRA",
      anio: 2026,
    });

    const secuenciaObra = await generarNumeroSolicitudPagoService({
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-obra",
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: "OBRA",
      anio: 2026,
    });

    expect(secuenciaProObra.referencia).toBe(
      "SOL-PRO-OBRA-HUMAPO-2026-000001",
    );

    expect(secuenciaObra.referencia).toBe(
      "SOL-OBRA-HUMAPO-2026-000001",
    );

    expect(generarSecuenciaDocumentalRepository).toHaveBeenNthCalledWith(1, {
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-pro-obra",
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: "PRO-OBRA",
      clave_contexto: "CENTRO:proyecto-1:centro-pro-obra",
      prefijo: "SOL",
      anio: 2026,
    });

    expect(generarSecuenciaDocumentalRepository).toHaveBeenNthCalledWith(2, {
      tipo_secuencia: "SOLICITUD_PAGO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-obra",
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: "OBRA",
      clave_contexto: "CENTRO:proyecto-1:centro-obra",
      prefijo: "SOL",
      anio: 2026,
    });
  });
});