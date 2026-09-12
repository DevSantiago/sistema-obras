import { describe, expect, it } from "vitest";
import {
  formatearEstadoHistorial,
  obtenerHistorialParaExportar,
} from "../HistorialAprobacionesList";
import type { SolicitudPagoListado } from "@/modules/solicitudes-pago/solicitudes-pago.types";

describe("formatearEstadoHistorial", () => {
  it("abrevia los estados largos sin perder su significado", () => {
    expect(formatearEstadoHistorial("PENDIENTE_APROBADOR_1")).toBe(
      "Pendiente N1",
    );
    expect(formatearEstadoHistorial("PENDIENTE_APROBADOR_2")).toBe(
      "Pendiente N2",
    );
    expect(formatearEstadoHistorial("PROGRAMADA_PAGO")).toBe("Programada");
    expect(formatearEstadoHistorial("DEVUELTA_APROBADOR_1")).toBe(
      "Devuelta a N1",
    );
  });

  it("conserva los estados que ya son breves", () => {
    expect(formatearEstadoHistorial("PAGADA")).toBe("Pagada");
    expect(formatearEstadoHistorial("ANULADA")).toBe("Anulada");
  });
});

describe("obtenerHistorialParaExportar", () => {
  const solicitudes = [
    { id: "1" },
    { id: "2" },
    { id: "3" },
  ] as SolicitudPagoListado[];

  it("exporta todo el historial cuando no hay filtros", () => {
    expect(
      obtenerHistorialParaExportar(solicitudes, [solicitudes[1]], false).map(
        (solicitud) => solicitud.id,
      ),
    ).toEqual(["1", "2", "3"]);
  });

  it("exporta los resultados cuando existen filtros", () => {
    expect(
      obtenerHistorialParaExportar(solicitudes, [solicitudes[1]], true).map(
        (solicitud) => solicitud.id,
      ),
    ).toEqual(["2"]);
  });
});
