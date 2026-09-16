import { describe, expect, it } from "vitest";
import type { BeneficiarioSolicitudCatalogo } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import {
  ordenarPorNumeroSolicitudDescendente,
  validarDatosBeneficiarioParaMedioPago,
} from "../solicitudes-pago.utils";

const beneficiario: BeneficiarioSolicitudCatalogo = {
  id: "beneficiario-1",
  tipo_beneficiario: "PROVEEDOR",
  nombre: "Proveedor Uno",
  tipo_documento: "NIT",
  numero_documento: "900123456",
  banco: "BANCOLOMBIA",
  tipo_cuenta_bancaria: "AHORROS",
  numero_cuenta_bancaria: "123456789",
};

describe("validarDatosBeneficiarioParaMedioPago", () => {
  it("permite efectivo sin datos bancarios", () => {
    expect(
      validarDatosBeneficiarioParaMedioPago(
        {
          ...beneficiario,
          banco: null,
          tipo_cuenta_bancaria: null,
          numero_cuenta_bancaria: null,
        },
        "EFECTIVO",
      ),
    ).toBeNull();
  });

  it("informa los datos faltantes para transferencia", () => {
    const resultado = validarDatosBeneficiarioParaMedioPago(
      { ...beneficiario, banco: null, numero_cuenta_bancaria: null },
      "TRANSFERENCIA",
    );

    expect(resultado).toContain("banco");
    expect(resultado).toContain("número de cuenta o convenio");
  });
});

describe("ordenarPorNumeroSolicitudDescendente", () => {
  it("ordena naturalmente de mayor a menor y deja los borradores al final", () => {
    const solicitudes = [
      { numero_solicitud: "SOL-PRO-OBRA-2026-000003" },
      { numero_solicitud: null },
      { numero_solicitud: "SOL-PRO-OBRA-2026-000024" },
      { numero_solicitud: "SOL-PRO-OBRA-2026-000011" },
    ];

    expect(
      ordenarPorNumeroSolicitudDescendente(solicitudes).map(
        (solicitud) => solicitud.numero_solicitud,
      ),
    ).toEqual([
      "SOL-PRO-OBRA-2026-000024",
      "SOL-PRO-OBRA-2026-000011",
      "SOL-PRO-OBRA-2026-000003",
      null,
    ]);
    expect(solicitudes[0]?.numero_solicitud).toBe(
      "SOL-PRO-OBRA-2026-000003",
    );
  });
});
