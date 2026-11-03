import { describe, expect, it } from "vitest";
import {
  normalizarFilaNominaGrupal,
  validarFilaNominaGrupal,
} from "../nomina-grupal.validators";

describe("validarFilaNominaGrupal", () => {
  it("explica cómo resolver diferencias entre el nombre del Excel y el beneficiario existente", () => {
    const filaRaw = {
      tipo_documento: "CC",
      numero_documento: "123456789",
      nombre_trabajador: "JUAN PEREZ GOMEZ",
      concepto_nomina: "SALARIO",
      medio_pago: "EFECTIVO",
      valor_total: 1500000,
    };
    const filaNormalizada = normalizarFilaNominaGrupal(filaRaw, 2);
    const resultado = validarFilaNominaGrupal({
      filaRaw,
      filaNormalizada,
      beneficiario: {
        id: "beneficiario-1",
        nombre: "JUAN PEREZ",
        tipo_beneficiario: "TRABAJADOR",
        tipo_documento: "CC",
        numero_documento: "123456789",
        medio_pago_preferido: "EFECTIVO",
        banco: null,
        tipo_cuenta_bancaria: null,
        numero_cuenta_bancaria: null,
        activo: true,
      },
    });

    expect(resultado.estado_validacion).toBe("INVALIDO");
    expect(resultado.errores_validacion[0]).toMatchObject({
      campo: "nombre_trabajador",
      codigo: "NOMBRE_NO_COINCIDE",
    });
    expect(resultado.errores_validacion[0].mensaje).toContain("CC 123456789");
    expect(resultado.errores_validacion[0].mensaje).toContain("JUAN PEREZ");
    expect(resultado.errores_validacion[0].mensaje).toContain("JUAN PEREZ GOMEZ");
    expect(resultado.errores_validacion[0].mensaje).toContain("módulo Beneficiarios");
  });
});
