import { describe, expect, it } from "vitest";
import { construirBeneficiarioContextualPayload } from "../shared/crear-beneficiario.utils";

describe("construirBeneficiarioContextualPayload", () => {
  it("elimina los datos bancarios para un trabajador con pago en efectivo", () => {
    const payload = construirBeneficiarioContextualPayload({
      tipoBeneficiario: "TRABAJADOR",
      nombre: "Trabajador nuevo",
      tipoDocumento: "CC",
      numeroDocumento: "123456",
      medioPago: "EFECTIVO",
      banco: "BANCOLOMBIA",
      tipoCuenta: "AHORROS",
      numeroCuenta: "999",
      telefono: "",
      correo: "",
      conceptoPago: "",
    });

    expect(payload).toMatchObject({
      tipo_beneficiario: "TRABAJADOR",
      banco: null,
      tipo_cuenta_bancaria: null,
      numero_cuenta_bancaria: null,
      proveedor: undefined,
    });
  });

  it("mantiene sincronizado el proveedor anidado exigido por el contrato", () => {
    const payload = construirBeneficiarioContextualPayload({
      tipoBeneficiario: "PROVEEDOR",
      nombre: "Proveedor nuevo",
      tipoDocumento: "NIT",
      numeroDocumento: "900123456",
      medioPago: "TRANSFERENCIA",
      banco: "BANCOLOMBIA",
      tipoCuenta: "CORRIENTE",
      numeroCuenta: "123456789",
      telefono: "3001234567",
      correo: " PROVEEDOR@EMPRESA.COM ",
      conceptoPago: "Materiales",
    });

    expect(payload.correo).toBe("proveedor@empresa.com");
    expect(payload.proveedor).toEqual({
      nombre: "Proveedor nuevo",
      tipo_documento: "NIT",
      numero_documento: "900123456",
      correo: "proveedor@empresa.com",
      telefono: "3001234567",
      banco: "BANCOLOMBIA",
      tipo_cuenta_bancaria: "CORRIENTE",
      numero_cuenta_bancaria: "123456789",
    });
  });
});
