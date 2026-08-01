import { describe, expect, it } from "vitest";
import { calcularPendienteOperacionEfectivo } from "../operaciones-efectivo.repository";

describe("calcularPendienteOperacionEfectivo", () => {
  it("debe reducir el pendiente con un ajuste de ingreso", () => {
    expect(
      calcularPendienteOperacionEfectivo(10000, 0, [
        { direccion: "INGRESO", valor: 10000 },
      ]),
    ).toBe(0);
  });

  it("debe aumentar el pendiente con un ajuste de egreso", () => {
    expect(
      calcularPendienteOperacionEfectivo(10000, 0, [
        { direccion: "EGRESO", valor: 5000 },
      ]),
    ).toBe(15000);
  });

  it("debe combinar reingresos y ajustes sin duplicar devoluciones", () => {
    expect(
      calcularPendienteOperacionEfectivo(20000, 5000, [
        { direccion: "INGRESO", valor: 10000 },
      ]),
    ).toBe(5000);
  });
});
