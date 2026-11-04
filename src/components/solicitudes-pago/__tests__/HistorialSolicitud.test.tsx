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
    expect(html).toContain("Antes");
    expect(html).toContain("Después");
    expect(html).toContain("Valor neto");
    expect(html).toContain("100000");
    expect(html).toContain("95000");
  });

  it("destaca la transición de estado cuando existe", () => {
    const html = renderToStaticMarkup(
      <HistorialSolicitud
        eventos={[
          {
            id: "evento-2",
            accion: "ENVIO_APROBACION",
            descripcion: "La solicitud fue enviada a aprobación.",
            estado_anterior: "BORRADOR",
            estado_nuevo: "PENDIENTE_APROBADOR_1",
            cambios: null,
            creado_en: "2026-08-08T15:00:00.000Z",
            usuario: { id: "usuario-1", nombre: "Solicitante" },
          },
        ]}
      />,
    );

    expect(html).toContain("Cambio de estado");
    expect(html).toContain("BORRADOR");
    expect(html).toContain("PENDIENTE APROBADOR 1");
  });

  it("muestra un estado vacío cuando no existen eventos", () => {
    const html = renderToStaticMarkup(
      <HistorialSolicitud eventos={[]} />,
    );

    expect(html).toContain("Todavía no hay eventos registrados.");
  });

  it("muestra los archivos adjuntos a una devolución", () => {
    const html = renderToStaticMarkup(
      <HistorialSolicitud
        eventos={[
          {
            id: "devolucion-1",
            solicitud_id: "solicitud-1",
            accion: "DEVOLUCION",
            descripcion: "Adjuntar soporte actualizado",
            estado_anterior: "PENDIENTE_APROBADOR_2",
            estado_nuevo: "DEVUELTA_APROBADOR_1",
            cambios: null,
            creado_en: "2026-08-08T15:00:00.000Z",
            usuario: { id: "usuario-1", nombre: "Aprobador Dos" },
            adjuntos: [
              {
                id: "adjunto-1",
                nombre_archivo: "evidencia.pdf",
                tipo_mime: "application/pdf",
              },
            ],
          },
        ]}
      />,
    );

    expect(html).toContain("Adjuntos de la devolución");
    expect(html).toContain("evidencia.pdf");
    expect(html).toContain(
      "/api/v1/solicitudes-pago/solicitud-1/adjuntos/adjunto-1",
    );
  });
});
