import { describe, expect, it } from "vitest";
import { crearTablaPdf } from "@/lib/pdf-export";

describe("crearTablaPdf", () => {
  it("genera un PDF paginado con las filas y filtros visibles", () => {
    const filas = Array.from({ length: 70 }, (_, indice) => ({
      numero: `SOL-${indice + 1}`,
      estado: "Pendiente aprobación",
    }));

    const pdf = crearTablaPdf({
      titulo: "Solicitudes filtradas",
      filtros: ["Proyecto: Central"],
      filas,
      columnas: [
        { titulo: "Solicitud", ancho: 50, valor: (fila) => fila.numero },
        { titulo: "Estado", ancho: 50, valor: (fila) => fila.estado },
      ],
    });
    const contenido = new TextDecoder("windows-1252").decode(pdf);

    expect(contenido.startsWith("%PDF-1.4")).toBe(true);
    expect(contenido).toContain("Solicitudes filtradas");
    expect(contenido).toContain("Proyecto: Central");
    expect(contenido).toContain("SOL-70");
    expect(contenido).toMatch(/\/Count [2-9]/);
    expect(contenido.endsWith("%%EOF")).toBe(true);
  });
});
