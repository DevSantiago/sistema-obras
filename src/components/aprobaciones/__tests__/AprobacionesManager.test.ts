import { describe, expect, it } from "vitest";
import {
  calcularDisponibleAntesSeleccionNivel1,
  calcularReservaRestanteNivel2,
  calcularSaldoProyectadoAprobacion,
  calcularSaldoTrasPagarSeleccion,
  ordenarSolicitudesParaExportar,
} from "../AprobacionesManager";
import type { SolicitudPagoListado } from "@/modules/solicitudes-pago/solicitudes-pago.types";

describe("calcularSaldoProyectadoAprobacion", () => {
  it("debe descontar la selección en nivel 1", () => {
    expect(
      calcularSaldoProyectadoAprobacion(1, 100000, 100000, 5000, 0),
    ).toBe(95000);
  });

  it("debe mostrar la selección completa en la resta sin duplicar una reserva existente", () => {
    expect(
      calcularDisponibleAntesSeleccionNivel1(6930000, 60000, 0),
    ).toBe(6990000);
    expect(6990000 - 60000).toBe(6930000);
  });

  it("debe usar el disponible actual cuando la selección aún no tiene reserva", () => {
    expect(
      calcularDisponibleAntesSeleccionNivel1(6930000, 60000, 60000),
    ).toBe(6930000);
  });

  it("debe incluir reservas previas y la selección en nivel 2", () => {
    expect(
      calcularSaldoProyectadoAprobacion(2, 100000, 85000, 5000, 10000),
    ).toBe(85000);
  });

  it("debe acumular las solicitudes seleccionadas en nivel 2", () => {
    expect(
      calcularSaldoProyectadoAprobacion(2, 100000, 80000, 12000, 5000),
    ).toBe(83000);
  });

  it("debe mostrar la reserva que permanece después de seleccionar", () => {
    expect(calcularReservaRestanteNivel2(1910000, 320000)).toBe(
      1590000,
    );
  });

  it("debe calcular el saldo contable tras pagar solo la selección", () => {
    expect(calcularSaldoTrasPagarSeleccion(24229700, 650000)).toBe(
      23579700,
    );
  });

  it("organiza la exportación por proyecto, centro y número de solicitud", () => {
    const solicitud = (
      id: string,
      proyecto: string,
      centro: string,
      numero: string,
    ) => ({
      id,
      numero_solicitud: numero,
      proyecto_base: { nombre: proyecto },
      centro_costo: { nombre: centro },
    }) as SolicitudPagoListado;

    const ordenadas = ordenarSolicitudesParaExportar([
      solicitud("3", "Proyecto B", "Centro A", "SOL-2"),
      solicitud("2", "Proyecto A", "Centro B", "SOL-1"),
      solicitud("1", "Proyecto A", "Centro A", "SOL-10"),
      solicitud("4", "Proyecto A", "Centro A", "SOL-2"),
    ]);

    expect(ordenadas.map((item) => item.id)).toEqual(["4", "1", "2", "3"]);
  });
});
