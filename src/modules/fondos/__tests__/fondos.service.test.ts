import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { consultarFondosRepository } from "../fondos.repository";
import { consultarFondosService } from "../fondos.service";

vi.mock("../fondos.repository", () => ({
  consultarFondosRepository: vi.fn(),
}));

const usuarioAdministrador: UsuarioSesion = {
  id: "admin-1",
  nombre: "Administrador",
  correo: "admin@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["ADMINISTRADOR"],
  permisos: ["CONSULTAR_FONDOS"],
};

const usuarioDirector: UsuarioSesion = {
  id: "director-1",
  nombre: "Director",
  correo: "director@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["DIRECTOR"],
  permisos: ["CONSULTAR_FONDOS"],
};

describe("fondos.service - consultarFondosService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar usuarios sin permiso", async () => {
    const resultado = await consultarFondosService({
      ...usuarioDirector,
      permisos: [],
    });

    expect(resultado.status).toBe(403);
    expect(consultarFondosRepository).not.toHaveBeenCalled();
  });

  it("debe limitar al director mediante sus accesos", async () => {
    vi.mocked(consultarFondosRepository).mockResolvedValue([]);

    await consultarFondosService(usuarioDirector);

    expect(consultarFondosRepository).toHaveBeenCalledWith({
      tipo: "ACCESOS",
      usuario_id: "director-1",
    });
  });

  it("debe consolidar egresos directos y pagos cubiertos por retiro", async () => {
    vi.mocked(consultarFondosRepository).mockResolvedValue([
      {
        id: "proyecto-1",
        nombre: "Proyecto Uno",
        estado_proyecto: "EN_EJECUCION",
        fondo: {
          id: "fondo-1",
          nombre: "Fondo general",
          saldo_actual: { toNumber: () => 700000 },
        },
        centros_costo: [
          {
            id: "centro-1",
            codigo: "OBRA-1",
            nombre: "Obra",
            linea_negocio: "OBRA",
            fase_centro_costo: "EJECUCION",
            estado_centro_costo: "EN_EJECUCION",
            movimientosFondos: [
              {
                tipo_movimiento: "EGRESO_SOLICITUD_PAGO",
                valor: { toNumber: () => 100000 },
              },
              {
                tipo_movimiento: "EGRESO_RETIRO_EFECTIVO",
                valor: { toNumber: () => 250000 },
              },
            ],
            solicitudes_pago: [
              {
                detalleOperacionEfectivo: {
                  valor_pagado: { toNumber: () => 200000 },
                },
              },
            ],
          },
        ],
      },
    ] as never);

    const resultado = await consultarFondosService(
      usuarioAdministrador,
    );

    expect(resultado.status).toBe(200);
    expect(consultarFondosRepository).toHaveBeenCalledWith({
      tipo: "TOTAL",
    });
    expect(resultado.body.data?.proyectos[0]).toEqual(
      expect.objectContaining({
        saldo_actual: 700000,
        gasto_total_visible: 300000,
        gasto_por_linea: [
          { clave: "OBRA", gasto_acumulado: 300000 },
        ],
      }),
    );
  });
});
