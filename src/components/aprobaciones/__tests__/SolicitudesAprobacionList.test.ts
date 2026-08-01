import { describe, expect, it } from "vitest";
import { calcularTotalSolicitudes } from "../SolicitudesAprobacionList";

describe("calcularTotalSolicitudes", () => {
  it("debe sumar el valor neto de todas las solicitudes de la tabla", () => {
    expect(
      calcularTotalSolicitudes([
        { valor_neto: 500000 },
        { valor_neto: 250000 },
      ] as never),
    ).toBe(750000);
  });
});
