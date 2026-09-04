import ExcelJS from "exceljs";
import { BANCOS_COLOMBIA } from "./bancos.constants";
import type { FilaProveedorMasivo } from "./beneficiarios.types";

const ENCABEZADOS = [
  "TIPO_IDENTIFICACION",
  "NUMERO_IDENTIFICACION",
  "NOMBRE_RAZON_SOCIAL",
  "CORREO",
  "TELEFONO",
  "MEDIO_PAGO_SUGERIDO",
  "BANCO",
  "TIPO_CUENTA",
  "NUMERO_CUENTA",
  "CONCEPTO_PAGO",
] as const;

function obtenerTextoCelda(celda: ExcelJS.Cell): string {
  const valor = celda.value;

  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object" && "text" in valor) {
    return String(valor.text).trim();
  }
  if (typeof valor === "object" && "result" in valor) {
    return String(valor.result ?? "").trim();
  }

  return String(valor).trim();
}

export async function leerProveedoresExcel(
  contenido: Buffer,
): Promise<FilaProveedorMasivo[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(contenido as never);
  const hoja = workbook.worksheets[0];

  if (!hoja) throw new Error("El archivo no contiene hojas de cálculo.");

  const posiciones = new Map<string, number>();
  hoja.getRow(1).eachCell((celda, columna) => {
    posiciones.set(obtenerTextoCelda(celda).toUpperCase(), columna);
  });

  const faltantes = ENCABEZADOS.filter(
    (encabezado) => !posiciones.has(encabezado),
  );
  if (faltantes.length > 0) {
    throw new Error(`Faltan columnas obligatorias: ${faltantes.join(", ")}.`);
  }

  const filas: FilaProveedorMasivo[] = [];
  hoja.eachRow((fila, numeroFila) => {
    if (numeroFila === 1) return;

    const valor = (encabezado: (typeof ENCABEZADOS)[number]) =>
      obtenerTextoCelda(fila.getCell(posiciones.get(encabezado)!));
    const datos = {
      fila: numeroFila,
      tipo_documento: valor("TIPO_IDENTIFICACION"),
      numero_documento: valor("NUMERO_IDENTIFICACION"),
      nombre: valor("NOMBRE_RAZON_SOCIAL"),
      correo: valor("CORREO"),
      telefono: valor("TELEFONO"),
      medio_pago_preferido: valor("MEDIO_PAGO_SUGERIDO"),
      banco: valor("BANCO"),
      tipo_cuenta_bancaria: valor("TIPO_CUENTA"),
      numero_cuenta_bancaria: valor("NUMERO_CUENTA"),
      concepto_pago: valor("CONCEPTO_PAGO"),
    };

    if (
      Object.entries(datos).some(
        ([campo, item]) => campo !== "fila" && String(item).trim(),
      )
    ) {
      filas.push(datos);
    }
  });

  if (filas.length === 0) throw new Error("El archivo no contiene proveedores.");
  if (filas.length > 1000) throw new Error("El archivo supera el máximo de 1.000 proveedores.");

  return filas;
}

export async function generarPlantillaProveedoresExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet("Proveedores");
  hoja.addRow([...ENCABEZADOS]);
  hoja.addRow([
    "NIT",
    "900123456",
    "PROVEEDOR EJEMPLO SAS",
    "contacto@proveedor.com",
    "3001234567",
    "TRANSFERENCIA",
    "BANCOLOMBIA",
    "CORRIENTE",
    "1234567890",
    "SUMINISTRO DE MATERIALES",
  ]);
  hoja.columns = [16, 22, 32, 30, 18, 24, 26, 18, 24, 36].map((width) => ({ width }));
  hoja.getRow(1).eachCell((celda) => {
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  });
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.autoFilter = { from: "A1", to: "J1" };

  const catalogos = workbook.addWorksheet("Catálogos");
  catalogos.addRow(["TIPO_IDENTIFICACION", "MEDIO_PAGO", "TIPO_CUENTA", "BANCOS"]);
  const maximo = Math.max(BANCOS_COLOMBIA.length, 4);
  for (let indice = 0; indice < maximo; indice += 1) {
    catalogos.addRow([
      ["NIT", "CC", "CE"][indice] ?? "",
      ["TRANSFERENCIA", "CONSIGNACION", "EFECTIVO"][indice] ?? "",
      ["AHORROS", "CORRIENTE", "CONVENIO", "OTRO"][indice] ?? "",
      BANCOS_COLOMBIA[indice] ?? "",
    ]);
  }
  catalogos.columns = [{ width: 24 }, { width: 24 }, { width: 20 }, { width: 30 }];

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
