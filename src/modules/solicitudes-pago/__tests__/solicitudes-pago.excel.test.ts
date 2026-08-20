import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { generarRelacionSolicitudesProgramadasExcel } from "../solicitudes-pago.excel";

describe("generarRelacionSolicitudesProgramadasExcel", () => {
  it("incluye datos de solicitud, beneficiario y trazabilidad", async () => {
    const contenido = await generarRelacionSolicitudesProgramadasExcel([
      {
        id: "solicitud-1",
        numero_solicitud: "SOL-PRO-OBRA-2026-000001",
        estado_actual: "PROGRAMADA_PAGO",
        tipo_solicitud: "PAGO_PROVEEDOR",
        modalidad_nomina: null,
        proyecto_base: {
          id: "proyecto-1",
          nombre: "LOMA LINDA",
          estado_proyecto: "EN_EJECUCION",
        },
        centro_costo: {
          id: "centro-1",
          nombre: "PRO-OBRA - LOMA LINDA",
          linea_negocio: "OBRA",
          fase_centro_costo: "LICITACION",
          estado_centro_costo: "EN_EJECUCION",
        },
        beneficiario: {
          id: "beneficiario-1",
          nombre: "PROVEEDOR PRUEBA",
          tipo_beneficiario: "PROVEEDOR",
          tipo_documento: "NIT",
          numero_documento: "900123456",
          banco: "BANCO PRUEBA",
          tipo_cuenta_bancaria: "AHORROS",
          numero_cuenta_bancaria: "123456789",
        },
        proveedor: null,
        medio_pago: "TRANSFERENCIA",
        descripcion: "Pago de materiales",
        valor_bruto: 100000,
        valor_retenciones: 10000,
        valor_descuentos: 0,
        valor_neto: 90000,
        creado_en: "2026-08-01T15:00:00.000Z",
        aprobado_1_en: "2026-08-01T16:00:00.000Z",
        aprobado_2_en: "2026-08-01T17:00:00.000Z",
        pagado_en: null,
      } as never,
    ]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(contenido as never);
    const hoja = workbook.getWorksheet("Solicitudes programadas");

    expect(hoja?.getCell("A2").value).toBe(
      "SOL-PRO-OBRA-2026-000001",
    );
    expect(hoja?.getCell("F2").value).toBe("PROVEEDOR PRUEBA");
    expect(hoja?.getCell("I2").value).toBe("BANCO PRUEBA");
    expect(hoja?.getCell("R2").value).toBeTruthy();
    expect(hoja?.getCell("S2").value).toBeTruthy();
    expect(hoja?.getCell("T2").value).toBeTruthy();
    expect(hoja?.getCell("U2").value).toBe("");
  });
});
