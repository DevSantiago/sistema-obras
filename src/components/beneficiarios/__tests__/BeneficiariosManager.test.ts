import { describe, expect, it } from "vitest";
import { requiereDatosBancarios } from "../BeneficiariosManager";

describe("requiereDatosBancarios", () => {
  it("debe mantener los datos bancarios deshabilitados sin medio de pago", () => {
    expect(requiereDatosBancarios("")).toBe(false);
  });

  it("debe deshabilitar los datos bancarios para efectivo", () => {
    expect(requiereDatosBancarios("EFECTIVO")).toBe(false);
  });

  it("debe habilitar los datos bancarios para transferencia", () => {
    expect(requiereDatosBancarios("TRANSFERENCIA")).toBe(true);
  });

  it("debe habilitar los datos bancarios para consignación", () => {
    expect(requiereDatosBancarios("CONSIGNACION")).toBe(true);
  });
});
