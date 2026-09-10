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

function escapar(valor: unknown): string {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function crearTablaExcelXml<T>({
  nombreHoja,
  columnas,
  filas,
  resumen = [],
}: Omit<ExportarTablaExcelOpciones<T>, "nombreArchivo">): string {
  const filasResumen = resumen
    .map((item) => `<Row><Cell><Data ss:Type="String">${escapar(item.etiqueta)}</Data></Cell><Cell><Data ss:Type="${typeof item.valor === "number" ? "Number" : "String"}">${escapar(item.valor)}</Data></Cell></Row>`)
    .join("");
  const encabezados = columnas
    .map((columna) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapar(columna.titulo)}</Data></Cell>`)
    .join("");
  const contenido = filas
    .map((fila) => `<Row>${columnas.map((columna) => {
      const valor = columna.valor(fila) ?? "";
      return `<Cell${columna.formato ? ' ss:StyleID="Currency"' : ""}><Data ss:Type="${typeof valor === "number" ? "Number" : "String"}">${escapar(valor)}</Data></Cell>`;
    }).join("")}</Row>`)
    .join("");
  const definicionColumnas = columnas
    .map((columna) => `<Column ss:AutoFitWidth="0" ss:Width="${(columna.ancho ?? 20) * 6}"/>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1D4ED8" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/></Style><Style ss:ID="Currency"><NumberFormat ss:Format="&quot;$&quot;#,##0"/></Style></Styles><Worksheet ss:Name="${escapar(nombreHoja.slice(0, 31))}"><Table>${definicionColumnas}${filasResumen}${resumen.length > 0 ? "<Row/>" : ""}<Row>${encabezados}</Row>${contenido}</Table></Worksheet></Workbook>`;
}

export async function descargarTablaExcel<T>(
  opciones: ExportarTablaExcelOpciones<T>,
): Promise<void> {
  const contenido = crearTablaExcelXml(opciones);
  const blob = new Blob([contenido], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = opciones.nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}
