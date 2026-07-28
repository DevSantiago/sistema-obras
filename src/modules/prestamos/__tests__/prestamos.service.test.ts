import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { storageService } from "@/modules/storage/storage.service";
import {
  RegistrarPrestamoError,
  registrarPrestamoEntreProyectosRepository,
  registrarPrestamoPersonaRepository,
} from "../prestamos.repository";
import {
  registrarPrestamoEntreProyectosService,
  registrarPrestamoPersonaService,
} from "../prestamos.service";

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    guardarArchivo: vi.fn(),
    eliminarArchivo: vi.fn(),
  },
}));

vi.mock("../prestamos.repository", () => ({
  RegistrarPrestamoError: class extends Error {},
  registrarPrestamoEntreProyectosRepository: vi.fn(),
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
    observacion: "Capital de trabajo",
    soporte: new File(["soporte"], "prestamo.pdf", {
      type: "application/pdf",
    }),
  };
}

function crearInputEntreProyectos() {
  return {
    proyecto_origen_id: "proyecto-origen",
    proyecto_destino_id: "proyecto-destino",
    valor: 300000,
    observacion: "Traslado temporal",
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
    vi.mocked(
      registrarPrestamoEntreProyectosRepository,
    ).mockResolvedValue({
      id: "prestamo-2",
      referencia_sistema: "PRE-DESTINO-2026-000001",
      proyecto_origen_id: "proyecto-origen",
      proyecto_origen_nombre: "Proyecto origen",
      proyecto_destino_id: "proyecto-destino",
      proyecto_destino_nombre: "Proyecto destino",
      valor_original: 300000,
      saldo_pendiente: 300000,
      saldo_origen_anterior: 800000,
      saldo_origen_nuevo: 500000,
      saldo_destino_anterior: 100000,
      saldo_destino_nuevo: 400000,
      fecha_operacion: "2026-07-28T15:00:00.000Z",
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

  it("debe registrar el préstamo con fecha del sistema y saldo pendiente", async () => {
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
        fecha_prestamo: expect.any(Date),
        registrado_en: expect.any(Date),
      }),
    );
    const inputRepositorio = vi.mocked(
      registrarPrestamoPersonaRepository,
    ).mock.calls[0][0];
    expect(inputRepositorio.fecha_prestamo).toBe(
      inputRepositorio.registrado_en,
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

  it("debe registrar el préstamo entre proyectos con la fecha del sistema", async () => {
    const resultado = await registrarPrestamoEntreProyectosService(
      usuario,
      crearInputEntreProyectos(),
    );

    expect(resultado.status).toBe(201);
    expect(
      registrarPrestamoEntreProyectosRepository,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        proyecto_origen_id: "proyecto-origen",
        proyecto_destino_id: "proyecto-destino",
        valor: 300000,
        fecha_operacion: expect.any(Date),
      }),
    );
    expect(resultado.body.data?.saldo_pendiente).toBe(300000);
  });

  it("debe impedir un préstamo hacia el mismo proyecto", async () => {
    const resultado = await registrarPrestamoEntreProyectosService(
      usuario,
      {
        ...crearInputEntreProyectos(),
        proyecto_destino_id: "proyecto-origen",
      },
    );

    expect(resultado.status).toBe(400);
    expect(
      registrarPrestamoEntreProyectosRepository,
    ).not.toHaveBeenCalled();
    expect(storageService.guardarArchivo).not.toHaveBeenCalled();
  });
});
