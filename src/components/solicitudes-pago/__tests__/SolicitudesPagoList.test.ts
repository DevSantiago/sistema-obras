import { describe, expect, it } from "vitest";
import type { SolicitudPagoListado } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { obtenerSolicitudesParaExportar } from "../lists/SolicitudesPagoList";

describe("obtenerSolicitudesParaExportar", () => {
  const solicitudes = [
    { id: "1" },
    { id: "2" },
    { id: "3" },
  ] as SolicitudPagoListado[];
  const solicitudesFiltradas = [solicitudes[1]];

  it("exporta todas las solicitudes cuando no hay filtros activos", () => {
    expect(
      obtenerSolicitudesParaExportar(
        solicitudes,
        solicitudesFiltradas,
        false,
      ).map((solicitud) => solicitud.id),
    ).toEqual(["1", "2", "3"]);
  });

  it("exporta solo los resultados cuando hay filtros activos", () => {
    expect(
      obtenerSolicitudesParaExportar(
        solicitudes,
        solicitudesFiltradas,
        true,
      ).map((solicitud) => solicitud.id),
    ).toEqual(["2"]);
  });
});
