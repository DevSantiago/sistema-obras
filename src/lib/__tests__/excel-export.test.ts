import { describe, expect, it } from "vitest";
import { crearTablaExcelXml } from "@/lib/excel-export";

describe("crearTablaExcelXml", () => {
  it("incluye resumen, encabezados y valores compatibles con Excel", () => {
    const contenido = crearTablaExcelXml({
      nombreHoja: "Aprobaciones nivel 1",
      resumen: [{ etiqueta: "Valor total", valor: 250000 }],
      filas: [{ numero: "SOL-001", valor: 250000 }],
      columnas: [
        { titulo: "Número", valor: (fila) => fila.numero },
        { titulo: "Valor", valor: (fila) => fila.valor },
      ],
    });

    expect(contenido).toContain("Excel.Sheet");
    expect(contenido).toContain("Aprobaciones nivel 1");
    expect(contenido).toContain("Valor total");
    expect(contenido).toContain("SOL-001");
    expect(contenido).toContain('ss:Type="Number">250000');
  });
});
