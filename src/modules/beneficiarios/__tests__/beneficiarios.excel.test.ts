import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  generarPlantillaProveedoresExcel,
  leerProveedoresExcel,
} from "../beneficiarios.excel";

describe("beneficiarios.excel", () => {
  it("genera una plantilla con datos y catálogos", async () => {
    const contenido = await generarPlantillaProveedoresExcel();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(contenido as never);

    expect(workbook.getWorksheet("Proveedores")?.getCell("A1").value).toBe(
      "TIPO_IDENTIFICACION",
    );
    expect(workbook.getWorksheet("Catálogos")).toBeDefined();
  });

  it("lee las filas de proveedores de la plantilla", async () => {
    const contenido = await generarPlantillaProveedoresExcel();
    const filas = await leerProveedoresExcel(contenido);

    expect(filas).toHaveLength(1);
    expect(filas[0]).toEqual(
      expect.objectContaining({
        fila: 2,
        numero_documento: "900123456",
        banco: "BANCOLOMBIA",
      }),
    );
  });
});
