type ColumnaExcel<T> = {
  titulo: string;
  valor: (fila: T) => string | number | null | undefined;
  ancho?: number;
  formato?: string;
};

type ExportarTablaExcelOpciones<T> = {
  nombreArchivo: string;
  nombreHoja: string;
  columnas: ColumnaExcel<T>[];
  filas: T[];
  resumen?: Array<{ etiqueta: string; valor: string | number }>;
};

export async function crearTablaExcel<T>({
  nombreHoja,
  columnas,
  filas,
  resumen = [],
}: Omit<ExportarTablaExcelOpciones<T>, "nombreArchivo">): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema Obras";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet(nombreHoja.slice(0, 31));

  resumen.forEach((item) => hoja.addRow([item.etiqueta, item.valor]));
  if (resumen.length > 0) hoja.addRow([]);

  const numeroFilaEncabezado = hoja.rowCount + 1;
  const filaEncabezado = hoja.addRow(
    columnas.map((columna) => columna.titulo),
  );

  filas.forEach((fila) => {
    hoja.addRow(columnas.map((columna) => columna.valor(fila) ?? ""));
  });

  columnas.forEach((columna, indice) => {
    const columnaHoja = hoja.getColumn(indice + 1);
    columnaHoja.width = columna.ancho ?? 20;
    if (columna.formato) columnaHoja.numFmt = columna.formato;
  });

  filaEncabezado.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1D4ED8" },
    };
    celda.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  });
  filaEncabezado.height = 26;

  if (columnas.length > 0) {
    hoja.autoFilter = {
      from: { row: numeroFilaEncabezado, column: 1 },
      to: { row: numeroFilaEncabezado, column: columnas.length },
    };
    hoja.views = [{ state: "frozen", ySplit: numeroFilaEncabezado }];
  }

  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

export async function descargarTablaExcel<T>(
  opciones: ExportarTablaExcelOpciones<T>,
): Promise<void> {
  const contenido = await crearTablaExcel(opciones);
  const blob = new Blob([contenido], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = opciones.nombreArchivo.endsWith(".xlsx")
    ? opciones.nombreArchivo
    : `${opciones.nombreArchivo.replace(/\.xls$/i, "")}.xlsx`;
  enlace.click();
  URL.revokeObjectURL(url);
}
