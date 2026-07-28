import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { storageService } from "@/modules/storage/storage.service";
import {
  RegistrarAnticipoError,
  registrarAnticipoRepository,
} from "../anticipos.repository";
import { registrarAnticipoService } from "../anticipos.service";

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    guardarArchivo: vi.fn(),
    eliminarArchivo: vi.fn(),
  },
}));

vi.mock("../anticipos.repository", () => ({
  RegistrarAnticipoError: class extends Error {},
  registrarAnticipoRepository: vi.fn(),
}));

const usuario: UsuarioSesion = {
  id: "usuario-1",
  nombre: "Auxiliar",
  correo: "auxiliar@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["AUXILIAR_CONTABLE"],
  permisos: ["REGISTRAR_ANTICIPOS", "CONSULTAR_FONDOS"],
};

function crearInput() {
  const fechaHoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return {
    proyecto_base_id: "proyecto-1",
    entidad_id: "entidad-1",
    valor: 500000,
    fecha_anticipo: fechaHoy,
    observacion: "Anticipo inicial",
    soporte: new File(["soporte"], "soporte.pdf", {
      type: "application/pdf",
    }),
  };
}

describe("anticipos.service - registrarAnticipoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storageService.guardarArchivo).mockResolvedValue({
      nombre_archivo: "soporte.pdf",
      nombre_bucket: "LOCAL",
      ruta_archivo: "storage/anticipos/soporte.pdf",
      tipo_mime: "application/pdf",
      tamano_archivo: BigInt(7),
    });
    vi.mocked(registrarAnticipoRepository).mockResolvedValue({
      id: "anticipo-1",
      referencia_sistema: "ANT-PROYECTO-2026-000001",
      proyecto_base_id: "proyecto-1",
      proyecto_nombre: "Proyecto",
      entidad_nombre: "Alcaldía Municipal",
      valor: 500000,
      fecha_anticipo: "2026-07-28T12:00:00.000Z",
      saldo_anterior: 100000,
      saldo_nuevo: 600000,
    });
  });

  it("debe rechazar usuarios sin permiso", async () => {
    const resultado = await registrarAnticipoService(
      { ...usuario, permisos: [] },
      crearInput(),
    );

    expect(resultado.status).toBe(403);
    expect(storageService.guardarArchivo).not.toHaveBeenCalled();
  });

  it("debe rechazar fechas futuras", async () => {
    const resultado = await registrarAnticipoService(usuario, {
      ...crearInput(),
      fecha_anticipo: "2999-01-01",
    });

    expect(resultado.status).toBe(400);
    expect(storageService.guardarArchivo).not.toHaveBeenCalled();
  });

  it("debe guardar el soporte y registrar el anticipo", async () => {
    const resultado = await registrarAnticipoService(
      usuario,
      crearInput(),
    );

    expect(resultado.status).toBe(201);
    expect(storageService.guardarArchivo).toHaveBeenCalledWith(
      expect.objectContaining({
        carpeta: "anticipos/soportes",
      }),
    );
    expect(registrarAnticipoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        proyecto_base_id: "proyecto-1",
        entidad_id: "entidad-1",
        valor: 500000,
        usuario_id: "usuario-1",
      }),
    );
  });

  it("debe eliminar el archivo si falla el registro", async () => {
    vi.mocked(registrarAnticipoRepository).mockRejectedValue(
      new RegistrarAnticipoError("Proyecto no disponible."),
    );

    const resultado = await registrarAnticipoService(
      usuario,
      crearInput(),
    );

    expect(resultado.status).toBe(409);
    expect(storageService.eliminarArchivo).toHaveBeenCalledWith(
      "storage/anticipos/soporte.pdf",
    );
  });
});
