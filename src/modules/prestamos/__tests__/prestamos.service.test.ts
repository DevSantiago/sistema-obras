import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { storageService } from "@/modules/storage/storage.service";
import {
  RegistrarPrestamoError,
  registrarPrestamoPersonaRepository,
} from "../prestamos.repository";
import { registrarPrestamoPersonaService } from "../prestamos.service";

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    guardarArchivo: vi.fn(),
    eliminarArchivo: vi.fn(),
  },
}));

vi.mock("../prestamos.repository", () => ({
  RegistrarPrestamoError: class extends Error {},
  registrarPrestamoPersonaRepository: vi.fn(),
}));

const usuario: UsuarioSesion = {
  id: "usuario-1",
  nombre: "Auxiliar",
  correo: "auxiliar@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["AUXILIAR_CONTABLE"],
  permisos: ["REGISTRAR_PRESTAMOS"],
};

function crearInput() {
  return {
    proyecto_base_id: "proyecto-1",
    acreedor_id: "acreedor-1",
    valor: 800000,
    fecha_prestamo: new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
    observacion: "Capital de trabajo",
    soporte: new File(["soporte"], "prestamo.pdf", {
      type: "application/pdf",
    }),
  };
}

describe("prestamos.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storageService.guardarArchivo).mockResolvedValue({
      nombre_archivo: "prestamo.pdf",
      nombre_bucket: "LOCAL",
      ruta_archivo: "storage/prestamos/prestamo.pdf",
      tipo_mime: "application/pdf",
      tamano_archivo: BigInt(7),
    });
    vi.mocked(
      registrarPrestamoPersonaRepository,
    ).mockResolvedValue({
      id: "prestamo-1",
      referencia_sistema: "PRE-PROYECTO-2026-000001",
      proyecto_base_id: "proyecto-1",
      proyecto_nombre: "Proyecto",
      acreedor_id: "acreedor-1",
      acreedor_nombre: "Persona",
      valor_original: 800000,
      saldo_pendiente: 800000,
      saldo_anterior_fondo: 100000,
      saldo_nuevo_fondo: 900000,
    });
  });

  it("debe exigir permiso", async () => {
    const resultado = await registrarPrestamoPersonaService(
      { ...usuario, permisos: [] },
      crearInput(),
    );

    expect(resultado.status).toBe(403);
    expect(storageService.guardarArchivo).not.toHaveBeenCalled();
  });

  it("debe registrar el préstamo y saldo pendiente", async () => {
    const resultado = await registrarPrestamoPersonaService(
      usuario,
      crearInput(),
    );

    expect(resultado.status).toBe(201);
    expect(registrarPrestamoPersonaRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        proyecto_base_id: "proyecto-1",
        acreedor_id: "acreedor-1",
        valor: 800000,
      }),
    );
    expect(resultado.body.data?.saldo_pendiente).toBe(800000);
  });

  it("debe eliminar el soporte cuando falla la persistencia", async () => {
    vi.mocked(
      registrarPrestamoPersonaRepository,
    ).mockRejectedValue(
      new RegistrarPrestamoError("Acreedor inválido."),
    );

    const resultado = await registrarPrestamoPersonaService(
      usuario,
      crearInput(),
    );

    expect(resultado.status).toBe(409);
    expect(storageService.eliminarArchivo).toHaveBeenCalledWith(
      "storage/prestamos/prestamo.pdf",
    );
  });
});
