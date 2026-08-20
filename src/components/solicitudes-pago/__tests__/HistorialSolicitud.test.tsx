import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HistorialSolicitud from "../shared/HistorialSolicitud";

describe("HistorialSolicitud", () => {
  it("muestra el responsable, la transición y los campos modificados", () => {
    const html = renderToStaticMarkup(
      <HistorialSolicitud
        eventos={[
          {
            id: "evento-1",
            accion: "EDICION_APROBADOR_1",
            descripcion: "Se actualizó la solicitud.",
            estado_anterior: "PENDIENTE_APROBADOR_1",
            estado_nuevo: "PENDIENTE_APROBADOR_1",
            cambios: {
              valor_neto: { anterior: 100000, nuevo: 95000 },
            },
            creado_en: "2026-08-08T15:00:00.000Z",
            usuario: { id: "usuario-1", nombre: "Aprobador Uno" },
          },
        ]}
      />,
    );

    expect(html).toContain("Editada por el aprobador nivel 1");
    expect(html).toContain("Aprobador Uno");
    expect(html).toContain("Valor neto");
    expect(html).toContain("100000");
    expect(html).toContain("95000");
  });

  it("muestra un estado vacío cuando no existen eventos", () => {
    const html = renderToStaticMarkup(
      <HistorialSolicitud eventos={[]} />,
    );

    expect(html).toContain("Todavía no hay eventos registrados.");
  });
});
