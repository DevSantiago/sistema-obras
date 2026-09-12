import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { crearTablaExcel } from "@/lib/excel-export";

describe("crearTablaExcel", () => {
  it("genera un XLSX real con resumen, encabezados, valores y formato", async () => {
    const contenido = await crearTablaExcel({
      nombreHoja: "Aprobaciones nivel 1",
      resumen: [{ etiqueta: "Valor total", valor: 250000 }],
      filas: [{ numero: "SOL-001", valor: 250000 }],
      columnas: [
        { titulo: "Número", valor: (fila) => fila.numero },
        {
          titulo: "Valor",
          formato: '"$"#,##0',
          valor: (fila) => fila.valor,
        },
      ],
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(contenido);
    const hoja = workbook.getWorksheet("Aprobaciones nivel 1");

    expect(hoja?.getCell("A1").value).toBe("Valor total");
    expect(hoja?.getCell("B1").value).toBe(250000);
    expect(hoja?.getCell("A3").value).toBe("Número");
    expect(hoja?.getCell("A4").value).toBe("SOL-001");
    expect(hoja?.getCell("B4").numFmt).toBe('"$"#,##0');
  });
});
