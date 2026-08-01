import { describe, expect, it } from "vitest";
import {
  calcularReservaRestanteNivel2,
  calcularSaldoProyectadoAprobacion,
  calcularSaldoTrasPagarSeleccion,
} from "../AprobacionesManager";

describe("calcularSaldoProyectadoAprobacion", () => {
  it("debe descontar la selección en nivel 1", () => {
    expect(
      calcularSaldoProyectadoAprobacion(1, 100000, 100000, 5000, 0),
    ).toBe(95000);
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
});
