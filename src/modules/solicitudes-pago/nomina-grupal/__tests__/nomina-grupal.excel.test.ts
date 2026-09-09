import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  generarPlantillaNominaGrupalExcel,
  leerExcelNominaGrupal,
} from "../nomina-grupal.excel";

describe("nomina-grupal.excel - plantilla", () => {
  it("genera la plantilla oficial con columnas, instrucciones y listas válidas", async () => {
    const contenido = await generarPlantillaNominaGrupalExcel();
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(contenido as never);

    const hoja = workbook.getWorksheet("Nomina grupal");
    const instrucciones = workbook.getWorksheet("Instrucciones");

    expect(hoja).toBeDefined();
    expect(instrucciones).toBeDefined();
    expect(hoja?.getRow(1).values).toEqual([
      undefined,
      "tipo_documento",
      "numero_documento",
      "nombre_trabajador",
      "concepto_nomina",
      "medio_pago",
      "valor_total",
      "banco",
      "tipo_cuenta_bancaria",
      "numero_cuenta_bancaria",
    ]);
    expect(hoja?.getCell("A2").dataValidation.formulae).toEqual([
      '"CC,CE,OTRO"',
    ]);
    expect(hoja?.getCell("E2").dataValidation.formulae).toEqual([
      '"TRANSFERENCIA,PSE,PORTAL,CONSIGNACION,EFECTIVO"',
    ]);
    expect(hoja?.getCell("H2").dataValidation.formulae).toEqual([
      '"AHORROS,CORRIENTE,OTRO"',
    ]);
    expect(instrucciones?.getCell("A1").value).toBe(
      "Plantilla de nómina grupal",
    );
  });

  it("permite diligenciar y leer una fila válida desde la plantilla generada", async () => {
    const contenido = await generarPlantillaNominaGrupalExcel();
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(contenido as never);

    const hoja = workbook.getWorksheet("Nomina grupal");

    expect(hoja).toBeDefined();

    if (!hoja) {
      throw new Error("No se generó la hoja de nómina grupal.");
    }

    hoja.getRow(2).values = [
      "CC",
      "1000123456",
      "Trabajador de prueba",
      "SALARIO",
      "EFECTIVO",
      1500000,
      "",
      "",
      "",
    ];

    const archivoDiligenciado = Buffer.from(
      await workbook.xlsx.writeBuffer(),
    );
    const resultado = await leerExcelNominaGrupal({
      contenido: archivoDiligenciado,
      nombre_archivo: "plantilla-nomina-grupal.xlsx",
    });

    expect(resultado.nombre_hoja).toBe("Nomina grupal");
    expect(resultado.filas).toHaveLength(1);
    expect(resultado.filas[0]).toEqual(
      expect.objectContaining({
        numero_fila: 2,
        tipo_documento: "CC",
        numero_documento: "1000123456",
        nombre_trabajador: "TRABAJADOR DE PRUEBA",
        medio_pago: "EFECTIVO",
        valor_total: 1500000,
      }),
    );
  });
});
